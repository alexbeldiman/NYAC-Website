import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = request.nextUrl;
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");

  if (
    !start_date ||
    !end_date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(start_date) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end_date)
  ) {
    return NextResponse.json(
      { error: "start_date and end_date are required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // All coaches and directors
  const { data: coaches, error: coachError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .in("role", ["coach", "director"])
    .order("last_name");

  if (coachError) {
    return NextResponse.json({ error: coachError.message }, { status: 500 });
  }

  // All non-cancelled lessons in range for these coaches
  const coachIds = (coaches ?? []).map((c) => c.id);

  const { data: lessons, error: lessonError } = await supabase
    .from("private_lessons")
    .select("id, coach_id, start_time, duration_minutes, status")
    .in("coach_id", coachIds)
    .neq("status", "cancelled")
    .gte("start_time", `${start_date}T00:00:00Z`)
    .lt("start_time", `${end_date}T24:00:00Z`);

  if (lessonError) {
    return NextResponse.json({ error: lessonError.message }, { status: 500 });
  }

  // Approved unavailability windows in range
  const { data: unavailability, error: unavailError } = await supabase
    .from("coach_availability")
    .select("id, coach_id, unavailable_from, unavailable_to, reason")
    .in("coach_id", coachIds)
    .eq("status", "approved")
    .lt("unavailable_from", `${end_date}T24:00:00Z`)
    .gte("unavailable_to", `${start_date}T00:00:00Z`);

  if (unavailError) {
    return NextResponse.json({ error: unavailError.message }, { status: 500 });
  }

  // Group lessons and unavailability by coach_id
  const lessonsByCoach: Record<string, typeof lessons> = {};
  const unavailByCoach: Record<string, typeof unavailability> = {};

  for (const lesson of lessons ?? []) {
    if (!lesson.coach_id) continue;
    (lessonsByCoach[lesson.coach_id] ??= []).push(lesson);
  }

  for (const window of unavailability ?? []) {
    (unavailByCoach[window.coach_id] ??= []).push(window);
  }

  const result = (coaches ?? []).map((coach) => ({
    ...coach,
    lessons: lessonsByCoach[coach.id] ?? [],
    unavailability: unavailByCoach[coach.id] ?? [],
  }));

  return NextResponse.json(result);
}
