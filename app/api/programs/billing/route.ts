import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
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

  // Mon–Fri range
  const weekEndDate = new Date(weekStartDate.getTime() + 4 * 86_400_000);
  const weekEnd = weekEndDate.toISOString().slice(0, 10);

  const { data: rows, error } = await supabase
    .from("mitl_academy_attendance")
    .select(
      `
      id,
      date,
      session:mitl_academy_sessions!mitl_academy_attendance_session_id_fkey(program, start_time),
      child:profiles!mitl_academy_attendance_child_id_fkey(first_name, last_name, audit_number)
      `
    )
    .gte("date", weekStart)
    .lte("date", weekEnd);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by audit_number, then by child name within each group
  type ChildKey = string;
  type GroupMap = Map<
    string, // audit_number
    {
      children: Map<ChildKey, { child_name: string; mitl_count: number; academy_count: number }>;
    }
  >;

  const groups: GroupMap = new Map();

  for (const row of rows ?? []) {
    const child = row.child as { first_name: string; last_name: string; audit_number: string } | null;
    const session = row.session as { program: string; start_time: string } | null;

    if (!child || !session) continue;

    const auditNumber = child.audit_number;
    const childName = `${child.first_name} ${child.last_name}`;

    if (!groups.has(auditNumber)) {
      groups.set(auditNumber, { children: new Map() });
    }

    const group = groups.get(auditNumber)!;

    if (!group.children.has(childName)) {
      group.children.set(childName, { child_name: childName, mitl_count: 0, academy_count: 0 });
    }

    const childEntry = group.children.get(childName)!;
    if (session.program === "mitl") {
      childEntry.mitl_count++;
    } else if (session.program === "academy") {
      childEntry.academy_count++;
    }
  }

  const result = Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([audit_number, { children }]) => {
      const members = Array.from(children.values());
      const total_mitl = members.reduce((sum, m) => sum + m.mitl_count, 0);
      const total_academy = members.reduce((sum, m) => sum + m.academy_count, 0);
      return { audit_number, members, total_mitl, total_academy };
    });

  return NextResponse.json(result);
}
