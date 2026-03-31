import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { notifyPrivateLessonCreated } from "@/lib/notifications";
import { NextResponse, type NextRequest } from "next/server";

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function buildLessonStartTime(date: Date, startTime: string): Date {
  const [hours, minutes] = startTime.split(":").map(Number);
  const d = new Date(date);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

function computeConfirmationSentAt(lessonStart: Date): string {
  const now = new Date();
  const hoursUntilLesson = (lessonStart.getTime() - now.getTime()) / 3_600_000;
  return hoursUntilLesson > 24
    ? new Date(lessonStart.getTime() - 24 * 3_600_000).toISOString()
    : new Date(now.getTime() + 6 * 3_600_000).toISOString();
}

export async function GET() {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("recurrences")
    .select(
      `
      *,
      member:profiles!recurrences_member_id_fkey(first_name, last_name, audit_number),
      coach:profiles!recurrences_coach_id_fkey(first_name, last_name)
      `
    )
    .eq("active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sorted = (data ?? []).sort((a, b) => {
    const coachCmp = (a.coach?.last_name ?? "").localeCompare(
      b.coach?.last_name ?? ""
    );
    if (coachCmp !== 0) return coachCmp;
    return (a.member?.last_name ?? "").localeCompare(b.member?.last_name ?? "");
  });

  return NextResponse.json(sorted);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["coach", "director", "creator"].includes(staff.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { member_id, coach_id, day_of_week, start_time, duration_minutes } =
    body;

  if (
    !member_id ||
    !coach_id ||
    !day_of_week ||
    !start_time ||
    !duration_minutes
  ) {
    return NextResponse.json(
      {
        error:
          "member_id, coach_id, day_of_week, start_time, and duration_minutes are required",
      },
      { status: 400 }
    );
  }

  const dayInt = DAY_MAP[String(day_of_week).toLowerCase()];
  if (dayInt === undefined) {
    return NextResponse.json({ error: "Invalid day_of_week" }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data: memberProfile } = await serviceClient
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", member_id)
    .single();

  const { data: recurrence, error: recurrenceError } = await serviceClient
    .from("recurrences")
    .insert({
      member_id,
      coach_id,
      day_of_week: dayInt,
      start_time,
      duration_minutes,
      created_by: staff.id,
    })
    .select()
    .single();

  if (recurrenceError) {
    return NextResponse.json(
      { error: recurrenceError.message },
      { status: 500 }
    );
  }

  const lessons: object[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    const date = new Date(today.getTime() + i * 86_400_000);
    if (date.getUTCDay() !== dayInt) continue;

    const lessonStart = buildLessonStartTime(date, start_time);
    const lessonEnd = new Date(
      lessonStart.getTime() + duration_minutes * 60_000
    );

    const { data: conflicts } = await serviceClient
      .from("private_lessons")
      .select("id, start_time, duration_minutes")
      .eq("coach_id", coach_id)
      .neq("status", "cancelled")
      .lt("start_time", lessonEnd.toISOString())
      .gte(
        "start_time",
        new Date(lessonStart.getTime() - 120 * 60_000).toISOString()
      );

    const hasConflict = (conflicts ?? []).some((existing) => {
      const existingStart = new Date(existing.start_time).getTime();
      const existingEnd = existingStart + existing.duration_minutes * 60_000;
      return (
        lessonStart.getTime() < existingEnd &&
        lessonEnd.getTime() > existingStart
      );
    });

    if (hasConflict) continue;

    const confirmation_sent_at = computeConfirmationSentAt(lessonStart);

    const { data: lesson, error: lessonError } = await serviceClient
      .from("private_lessons")
      .insert({
        member_id,
        booked_by_id: staff.id,
        coach_id,
        start_time: lessonStart.toISOString(),
        duration_minutes,
        status: "confirmed",
        is_recurring: true,
        recurrence_id: recurrence.id,
        booked_via: "coach",
        confirmation_sent_at,
      })
      .select()
      .single();

    if (!lessonError && lesson) {
      await notifyPrivateLessonCreated({
        lesson: {
          id: lesson.id,
          start_time: lesson.start_time,
          duration_minutes: lesson.duration_minutes,
          status: lesson.status,
        },
        member: memberProfile ?? { first_name: "", last_name: "" },
        booked_via: lesson.booked_via,
      });
      lessons.push(lesson);
    }
  }

  return NextResponse.json({ recurrence, lessons }, { status: 201 });
}
