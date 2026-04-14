import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withApiErrorHandling } from "@/lib/api";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();

    const { searchParams } = request.nextUrl;
    const last_name = searchParams.get("last_name");
    const audit_number = searchParams.get("audit_number");

    if (!last_name || !audit_number) {
      return NextResponse.json(
        { error: "last_name and audit_number are required" },
        { status: 400 }
      );
    }

    const { data: family, error: familyError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .ilike("last_name", last_name)
      .eq("audit_number", audit_number);

    if (familyError) {
      return NextResponse.json({ error: familyError.message }, { status: 500 });
    }

    if (!family || family.length === 0) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const memberIds = family.map((f) => f.id);
    const serviceClient = createServiceClient();
    const { data: lessons, error: lessonError } = await serviceClient
      .from("private_lessons")
      .select(
        `
        id,
        member_id,
        coach_id,
        start_time,
        duration_minutes,
        status,
        is_recurring,
        booked_via,
        confirmation_sent_at,
        confirmed_by_member,
        member:profiles!private_lessons_member_id_fkey(first_name, last_name, audit_number),
        coach:profiles!private_lessons_coach_id_fkey(first_name, last_name)
        `
      )
      .in("member_id", memberIds)
      .neq("booked_via", "court_booking")
      .order("start_time");

    if (lessonError) {
      return NextResponse.json({ error: lessonError.message }, { status: 500 });
    }

    const now = new Date();
    const upcoming: typeof lessons = [];
    const past: typeof lessons = [];
    for (const lesson of lessons ?? []) {
      const startTime = new Date(lesson.start_time);
      if (
        startTime >= now &&
        (lesson.status === "confirmed" || lesson.status === "pending_pickup")
      ) {
        upcoming.push(lesson);
      } else {
        past.push(lesson);
      }
    }
    past.reverse();

    return NextResponse.json({ upcoming, past, family });
  });
}
