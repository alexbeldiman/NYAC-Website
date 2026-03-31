import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { groupLessonRows } from "@/lib/billingHelpers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["director", "creator"].includes(staff.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const weekStart = searchParams.get("week_start");

  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json(
      { error: "week_start query param is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const weekStartDate = new Date(`${weekStart}T00:00:00Z`);
  if (weekStartDate.getUTCDay() !== 1) {
    return NextResponse.json(
      { error: "week_start must be a Monday" },
      { status: 400 }
    );
  }

  // Mon–Sun: exclusive upper bound is the following Monday
  const weekEndExclusive = new Date(weekStartDate.getTime() + 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data: rows, error } = await supabase
    .from("private_lessons")
    .select(
      `
      start_time,
      duration_minutes,
      member:profiles!private_lessons_member_id_fkey(first_name, last_name, audit_number),
      coach:profiles!private_lessons_coach_id_fkey(first_name, last_name)
      `
    )
    .in("status", ["completed", "confirmed"])
    .gte("start_time", `${weekStart}T00:00:00Z`)
    .lt("start_time", `${weekEndExclusive}T00:00:00Z`)
    .order("start_time");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const typed = (rows ?? []).map((r) => ({
    start_time: r.start_time,
    duration_minutes: r.duration_minutes,
    member: r.member as {
      first_name: string;
      last_name: string;
      audit_number: string;
    } | null,
    coach: r.coach as { first_name: string; last_name: string } | null,
  }));

  return NextResponse.json(groupLessonRows(typed));
}
