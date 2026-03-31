import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireStaffUser, withApiErrorHandling } from "@/lib/api";
import {
  sendLessonConfirmationRequest,
  notifyCoachesOfPickup,
} from "@/lib/notifications";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();
    const { response } = await requireStaffUser(supabase, [
      "coach",
      "director",
      "creator",
      "tennis_house",
    ]);
    if (response) return response;

    const { searchParams } = request.nextUrl;
    const coach_id = searchParams.get("coach_id");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    let query = supabase
      .from("private_lessons")
      .select(
        `
        *,
        member:profiles!private_lessons_member_id_fkey(first_name, last_name, audit_number),
        coach:profiles!private_lessons_coach_id_fkey(first_name, last_name)
        `
      )
      .order("start_time");

    if (coach_id) query = query.eq("coach_id", coach_id);
    if (status) query = query.eq("status", status);
    if (date) {
      query = query
        .gte("start_time", `${date}T00:00:00Z`)
        .lt("start_time", `${date}T24:00:00Z`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  });
}

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();

  const body = await request.json();
  const {
    last_name,
    audit_number,
    member_id,
    start_time,
    duration_minutes,
    coach_id,
  } = body;

  if (!last_name || !audit_number || !member_id || !start_time || !duration_minutes) {
    return NextResponse.json(
      { error: "last_name, audit_number, member_id, start_time, and duration_minutes are required" },
      { status: 400 }
    );
  }

  // 1. Verify family exists via last_name + audit_number
  const { data: family, error: familyError } = await supabase
    .from("profiles")
    .select("id, audit_number")
    .ilike("last_name", last_name)
    .eq("audit_number", audit_number);

  if (familyError) {
    return NextResponse.json({ error: familyError.message }, { status: 500 });
  }

  if (!family || family.length === 0) {
    return NextResponse.json(
      { error: "We couldn't find your information. Please check your details or speak to someone at the tennis house." },
      { status: 404 }
    );
  }

  // 2. Verify member_id belongs to that audit_number
  const memberBelongs = family.some((p) => p.id === member_id);
  if (!memberBelongs) {
    return NextResponse.json(
      { error: "The selected member does not belong to this account." },
      { status: 400 }
    );
  }

  // 3. If coach_id provided, verify coach exists with correct role
  if (coach_id) {
    const { data: coach, error: coachError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", coach_id)
      .single();

    if (coachError || !coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    if (coach.role !== "coach" && coach.role !== "director") {
      return NextResponse.json(
        { error: "The selected coach does not have a coach role" },
        { status: 400 }
      );
    }

    // 4. Check for conflicting lessons for this coach
    const lessonStart = new Date(start_time);
    const lessonEnd = new Date(lessonStart.getTime() + duration_minutes * 60_000);

    const { data: conflicts, error: conflictError } = await supabase
      .from("private_lessons")
      .select("id, start_time, duration_minutes")
      .eq("coach_id", coach_id)
      .neq("status", "cancelled")
      .lt("start_time", lessonEnd.toISOString())
      .gte("start_time", new Date(lessonStart.getTime() - 120 * 60_000).toISOString());

    if (conflictError) {
      return NextResponse.json({ error: conflictError.message }, { status: 500 });
    }

    const hasConflict = (conflicts ?? []).some((existing) => {
      const existingStart = new Date(existing.start_time).getTime();
      const existingEnd = existingStart + existing.duration_minutes * 60_000;
      const newStart = lessonStart.getTime();
      const newEnd = lessonEnd.getTime();
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: "The selected coach already has a lesson at this time" },
        { status: 409 }
      );
    }
  }

  // 5. Compute confirmation_sent_at
  const now = new Date();
  const start = new Date(start_time);
  const hoursUntilLesson = (start.getTime() - now.getTime()) / 3_600_000;
  const confirmation_sent_at =
    hoursUntilLesson > 24
      ? new Date(start.getTime() - 24 * 3_600_000).toISOString()
      : new Date(now.getTime() + 6 * 3_600_000).toISOString();

  const status = coach_id ? "confirmed" : "pending_pickup";

  // 6. Insert lesson
  const serviceClient = createServiceClient();
  console.log("attempting insert");
  const { data: lesson, error: insertError } = await serviceClient
    .from("private_lessons")
    .insert({
      member_id,
      booked_by_id: member_id,
      coach_id: coach_id ?? null,
      start_time,
      duration_minutes,
      status,
      booked_via: "member_app",
      confirmation_sent_at,
    })
    .select()
    .single();

  if (insertError) {
    console.log("insert error:", JSON.stringify(insertError, null, 2));
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Fetch member name for notifications
  const { data: memberProfile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", member_id)
    .single();

  const notifMember = memberProfile ?? { first_name: "", last_name: "" };

  // 7. If pending_pickup, insert pickup_request and notify coaches
  if (status === "pending_pickup") {
    await serviceClient.from("pickup_requests").insert({ lesson_id: lesson.id });

    const { data: coaches } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .in("role", ["coach", "director"]);

    await notifyCoachesOfPickup(lesson, coaches ?? [], notifMember);
  }

  // If confirmed, send confirmation request to member
  if (status === "confirmed") {
    await sendLessonConfirmationRequest(lesson, notifMember);
  }

    return NextResponse.json(lesson, { status: 201 });
  });
}
