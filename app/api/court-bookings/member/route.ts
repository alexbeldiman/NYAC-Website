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
      .select("id")
      .ilike("last_name", last_name)
      .eq("audit_number", audit_number);

    if (familyError) {
      return NextResponse.json({ error: familyError.message }, { status: 500 });
    }

    if (!family || family.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberIds = family.map((f) => f.id);
    const serviceClient = createServiceClient();

    const { data: bookings, error: bookingsError } = await serviceClient
      .from("court_bookings")
      .select(
        `
        id,
        member_id,
        start_time,
        duration_minutes,
        status,
        court:courts!court_bookings_court_id_fkey(id, name),
        member:profiles!court_bookings_member_id_fkey(first_name, last_name)
        `
      )
      .in("member_id", memberIds)
      .order("start_time");

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    const now = new Date();
    const upcoming: typeof bookings = [];
    const past: typeof bookings = [];

    for (const booking of bookings ?? []) {
      const startTime = new Date(booking.start_time);
      if (startTime >= now && booking.status === "confirmed") {
        upcoming.push(booking);
      } else {
        past.push(booking);
      }
    }
    past.reverse();

    return NextResponse.json({ upcoming, past });
  });
}
