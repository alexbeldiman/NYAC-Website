import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
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

  const body = await request.json();
  const { coach_response } = body;

  if (typeof coach_response !== "boolean") {
    return NextResponse.json(
      { error: "coach_response (boolean) is required" },
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient();

  // Fetch the review to get the lesson_id
  const { data: review, error: fetchError } = await supabase
    .from("lesson_cancellation_reviews")
    .select("*, lesson_id")
    .eq("id", params.id)
    .single();

  if (fetchError || !review) {
    return NextResponse.json(
      { error: "Cancellation review not found" },
      { status: 404 }
    );
  }

  // Update the review
  const now = new Date();
  const { data: updatedReview, error: updateError } = await serviceClient
    .from("lesson_cancellation_reviews")
    .update({
      coach_response,
      coach_responded_at: now.toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If coach says lesson did happen, set lesson status back to completed
  if (coach_response === true) {
    await serviceClient
      .from("private_lessons")
      .update({ status: "completed" })
      .eq("id", review.lesson_id);
  }
  // If coach_response is false, leave status as cancelled — no action needed

  return NextResponse.json(updatedReview);
}
