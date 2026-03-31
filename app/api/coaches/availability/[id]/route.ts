import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { notifyCoachAvailabilityApproved } from "@/lib/notifications";
import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (
    !staff ||
    (staff.role !== "director" && staff.role !== "creator")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { status } = body;

  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json(
      { error: "status must be 'approved' or 'rejected'" },
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient();
  const decisionTimestamp = new Date().toISOString();

  const { data: updated, error } = await serviceClient
    .from("coach_availability")
    .update({
      status,
      approved_by: staff.id,
      approved_at: decisionTimestamp,
    })
    .eq("id", params.id)
    .select(
      "*, coach:profiles!coach_availability_coach_id_fkey(first_name, last_name)"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json(
      { error: "Availability request not found" },
      { status: 404 }
    );
  }

  if (status === "approved") {
    const coach = updated.coach as {
      first_name: string;
      last_name: string;
    } | null;
    if (coach) {
      await notifyCoachAvailabilityApproved(updated, coach);
    }
  }

  return NextResponse.json(updated);
}
