import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withApiErrorHandling } from "@/lib/api";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();
    const body = await request.json();
    const { audit_number, last_name, member_id, court_id, start_time, duration_minutes } = body;

    if (!audit_number || !last_name || !member_id || !court_id || !start_time || !duration_minutes) {
      return NextResponse.json(
        { error: "audit_number, last_name, member_id, court_id, start_time, and duration_minutes are required" },
        { status: 400 }
      );
    }

    // Verify family via last_name + audit_number
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

    // Verify member_id belongs to this family
    if (!family.some((p) => p.id === member_id)) {
      return NextResponse.json(
        { error: "The selected member does not belong to this account." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Check for conflicting court bookings on this court
    const bookingStart = new Date(start_time);
    const bookingEnd = new Date(bookingStart.getTime() + duration_minutes * 60_000);

    const { data: conflicts, error: conflictError } = await serviceClient
      .from("court_bookings")
      .select("id, start_time, duration_minutes")
      .eq("court_id", court_id)
      .eq("status", "confirmed")
      .lt("start_time", bookingEnd.toISOString())
      .gte("start_time", new Date(bookingStart.getTime() - 120 * 60_000).toISOString());

    if (conflictError) {
      return NextResponse.json({ error: conflictError.message }, { status: 500 });
    }

    const hasConflict = (conflicts ?? []).some((existing) => {
      const existingStart = new Date(existing.start_time).getTime();
      const existingEnd = existingStart + existing.duration_minutes * 60_000;
      return bookingStart.getTime() < existingEnd && bookingEnd.getTime() > existingStart;
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: "This court is already booked for that time." },
        { status: 409 }
      );
    }

    const { data: booking, error: insertError } = await serviceClient
      .from("court_bookings")
      .insert({
        member_id,
        booked_by_id: member_id,
        court_id,
        start_time,
        duration_minutes,
        status: "confirmed",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(booking, { status: 201 });
  });
}
