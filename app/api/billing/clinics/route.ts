import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { groupClinicRows } from "@/lib/billingHelpers";
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
  if (weekStartDate.getUTCDay() !== 6) {
    return NextResponse.json(
      { error: "week_start must be a Saturday" },
      { status: 400 }
    );
  }

  const saturday = weekStart;
  const sunday = new Date(weekStartDate.getTime() + 86_400_000)
    .toISOString()
    .slice(0, 10);

  // Step 1: resolve slot IDs for the two dates
  const { data: slots, error: slotsError } = await supabase
    .from("clinic_slots")
    .select("id, date, hour, gender_restriction")
    .in("date", [saturday, sunday]);

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  if (!slots || slots.length === 0) {
    return NextResponse.json([]);
  }

  const slotIds = slots.map((s) => s.id);
  const slotMap = new Map(slots.map((s) => [s.id, s]));

  // Step 2: fetch signups for those slots
  const { data: signups, error: signupsError } = await supabase
    .from("clinic_signups")
    .select(
      `
      slot_id,
      guest_count,
      member:profiles!clinic_signups_member_id_fkey(first_name, last_name, audit_number)
      `
    )
    .in("slot_id", slotIds);

  if (signupsError) {
    return NextResponse.json({ error: signupsError.message }, { status: 500 });
  }

  const rows = (signups ?? []).map((signup) => ({
    guest_count: signup.guest_count,
    slot: slotMap.get(signup.slot_id) ?? null,
    member: signup.member as {
      first_name: string;
      last_name: string;
      audit_number: string;
    } | null,
  }));

  return NextResponse.json(groupClinicRows(rows));
}
