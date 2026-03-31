import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const coachId = params.id;

  // Fetch private lessons for this coach in the date range (not cancelled)
  const { data: lessons, error: lessonError } = await supabase
    .from("private_lessons")
    .select(
      `
      *,
      member:profiles!private_lessons_member_id_fkey(first_name, last_name)
      `
    )
    .eq("coach_id", coachId)
    .neq("status", "cancelled")
    .gte("start_time", `${start_date}T00:00:00Z`)
    .lt("start_time", `${end_date}T24:00:00Z`)
    .order("start_time", { ascending: true });

  if (lessonError) {
    return NextResponse.json({ error: lessonError.message }, { status: 500 });
  }

  // Fetch approved unavailability windows in the date range
  const { data: unavailability, error: unavailError } = await supabase
    .from("coach_availability")
    .select("*")
    .eq("coach_id", coachId)
    .eq("status", "approved")
    .lt("unavailable_from", `${end_date}T24:00:00Z`)
    .gte("unavailable_to", `${start_date}T00:00:00Z`);

  if (unavailError) {
    return NextResponse.json({ error: unavailError.message }, { status: 500 });
  }

  // Fetch clinic slots in that range (coach assignment not yet built, return all)
  const { data: clinicSlots, error: clinicError } = await supabase
    .from("clinic_slots")
    .select("*")
    .gte("date", start_date)
    .lte("date", end_date)
    .order("date")
    .order("hour");

  if (clinicError) {
    return NextResponse.json({ error: clinicError.message }, { status: 500 });
  }

  return NextResponse.json({
    lessons: lessons ?? [],
    unavailability: unavailability ?? [],
    clinic_slots: clinicSlots ?? [],
  });
}
