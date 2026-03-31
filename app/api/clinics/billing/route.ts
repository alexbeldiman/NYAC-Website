import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff || (staff.role !== "director" && staff.role !== "creator")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const week_start = request.nextUrl.searchParams.get("week_start");

  if (!week_start || !/^\d{4}-\d{2}-\d{2}$/.test(week_start)) {
    return NextResponse.json(
      { error: "week_start query param is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // Validate it's a Saturday (day 6)
  const startDate = new Date(week_start + "T00:00:00Z");
  if (startDate.getUTCDay() !== 6) {
    return NextResponse.json(
      { error: "week_start must be a Saturday" },
      { status: 400 }
    );
  }

  const sunday = new Date(startDate);
  sunday.setUTCDate(sunday.getUTCDate() + 1);
  const sundayStr = sunday.toISOString().slice(0, 10);

  // Fetch all signups for Saturday and Sunday, joined with slot date and member profile
  const { data: signups, error } = await supabase
    .from("clinic_signups")
    .select(
      "id, guest_count, checked_in, member_id, profiles!clinic_signups_member_id_fkey(id, first_name, last_name, audit_number), clinic_slots!inner(date)"
    )
    .in("clinic_slots.date", [week_start, sundayStr]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by audit_number
  const groups: Record<
    string,
    {
      audit_number: string;
      member_name: string;
      total_sessions: number;
      total_guests: number;
      signups: typeof signups;
    }
  > = {};

  for (const signup of signups ?? []) {
    const profile = signup.profiles as {
      id: string;
      first_name: string;
      last_name: string;
      audit_number: string;
    } | null;

    if (!profile) continue;

    const key = profile.audit_number;

    if (!groups[key]) {
      groups[key] = {
        audit_number: profile.audit_number,
        member_name: `${profile.first_name} ${profile.last_name}`,
        total_sessions: 0,
        total_guests: 0,
        signups: [],
      };
    }

    groups[key].total_sessions += 1;
    groups[key].total_guests += signup.guest_count;
    groups[key].signups.push(signup);
  }

  return NextResponse.json(Object.values(groups).sort((a, b) =>
    a.audit_number.localeCompare(b.audit_number)
  ));
}
