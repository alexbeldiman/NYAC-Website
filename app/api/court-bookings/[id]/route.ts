import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withApiErrorHandling } from "@/lib/api";
import { NextResponse, type NextRequest } from "next/server";

// PATCH /api/court-bookings/[id]  { audit_number, last_name, action: 'cancel' }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { audit_number, last_name, action } = body;

    if (!audit_number || !last_name) {
      return NextResponse.json(
        { error: "audit_number and last_name are required" },
        { status: 400 }
      );
    }

    if (action !== "cancel") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Verify family
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

    // Fetch the booking and verify it belongs to this family
    const { data: booking, error: fetchError } = await serviceClient
      .from("court_bookings")
      .select("id, member_id, status, start_time")
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!memberIds.includes(booking.member_id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "Booking is already cancelled" }, { status: 409 });
    }

    if (new Date(booking.start_time) < new Date()) {
      return NextResponse.json(
        { error: "Cannot cancel a booking that has already started" },
        { status: 409 }
      );
    }

    const { data: updated, error: updateError } = await serviceClient
      .from("court_bookings")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  });
}
