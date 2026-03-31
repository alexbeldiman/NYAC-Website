import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { extractFamilyNames, groupMitlAcademyRows } from "@/lib/billingHelpers";
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

  const typedRows = (rows ?? []).map((r) => ({
      session: r.session as { program: string; start_time: string } | null,
      child: r.child as {
        first_name: string;
        last_name: string;
        audit_number: string;
      } | null,
    }));

  const grouped = groupMitlAcademyRows(typedRows);
  const familyNames = extractFamilyNames(typedRows);
  const result = grouped.map((group) => ({
    ...group,
    family_name: familyNames.get(group.audit_number) ?? "",
  }));

  return NextResponse.json(result);
}
