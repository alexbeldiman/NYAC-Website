import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (
    !staff ||
    (staff.role !== "coach" &&
      staff.role !== "director" &&
      staff.role !== "creator")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the pickup request
  const { data: pickup, error: pickupError } = await supabase
    .from("pickup_requests")
    .select("id, lesson_id, claimed_by")
    .eq("id", params.id)
    .single();

  if (pickupError || !pickup) {
    return NextResponse.json(
      { error: "Pickup request not found" },
      { status: 404 }
    );
  }

  if (pickup.claimed_by !== null) {
    return NextResponse.json(
      { error: "This lesson has already been claimed by another coach" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();

  // Claim the pickup request
  const { error: pickupUpdateError, count } = await supabase
    .from("pickup_requests")
    .update({ claimed_by: staff.id, claimed_at: now })
    .eq("id", params.id)
    .is("claimed_by", null); // optimistic lock: only update if still unclaimed

  if (pickupUpdateError) {
    return NextResponse.json(
      { error: pickupUpdateError.message },
      { status: 500 }
    );
  }

  // count === 0 means another coach claimed it between our read and this write
  if (count === 0) {
    return NextResponse.json(
      { error: "This lesson was just claimed by another coach" },
      { status: 409 }
    );
  }

  // Update the lesson
  const { data: lesson, error: lessonError } = await supabase
    .from("private_lessons")
    .update({ coach_id: staff.id, status: "confirmed" })
    .eq("id", pickup.lesson_id)
    .select(
      `
      *,
      member:profiles!private_lessons_member_id_fkey(first_name, last_name, audit_number),
      coach:profiles!private_lessons_coach_id_fkey(first_name, last_name)
      `
    )
    .single();

  if (lessonError) {
    return NextResponse.json({ error: lessonError.message }, { status: 500 });
  }

  return NextResponse.json(lesson, { status: 200 });
}
