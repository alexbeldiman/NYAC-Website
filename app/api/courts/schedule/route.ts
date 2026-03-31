import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["tennis_house", "director", "creator"].includes(staff.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date query param is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const [courtsResult, lessonsResult] = await Promise.all([
    supabase.from("courts").select("id, name, is_pro_court, status, blocked_reason").order("name"),
    supabase
      .from("private_lessons")
      .select(
        `
        id,
        court_id,
        start_time,
        duration_minutes,
        status,
        member:profiles!private_lessons_member_id_fkey(first_name, last_name),
        coach:profiles!private_lessons_coach_id_fkey(first_name, last_name)
        `
      )
      .gte("start_time", `${date}T00:00:00Z`)
      .lt("start_time", `${date}T24:00:00Z`)
      .neq("status", "cancelled")
      .order("start_time"),
  ]);

  if (courtsResult.error) {
    return NextResponse.json(
      { error: courtsResult.error.message },
      { status: 500 }
    );
  }

  if (lessonsResult.error) {
    return NextResponse.json(
      { error: lessonsResult.error.message },
      { status: 500 }
    );
  }

  const lessons = lessonsResult.data ?? [];

  const lessonsByCourt = lessons.reduce<Record<string, typeof lessons>>(
    (acc, lesson) => {
      if (!lesson.court_id) return acc;
      if (!acc[lesson.court_id]) acc[lesson.court_id] = [];
      acc[lesson.court_id]!.push(lesson);
      return acc;
    },
    {}
  );

  const courts = (courtsResult.data ?? []).map((court) => ({
    ...court,
    lessons: lessonsByCourt[court.id] ?? [],
  }));

  const unassigned = lessons.filter((l) => !l.court_id);

  return NextResponse.json({ courts, unassigned });
}
