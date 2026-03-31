import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { sendLessonConfirmationRequest } from "@/lib/notifications";
import { NextResponse } from "next/server";

const SENT_SENTINEL = "2000-01-01T00:00:00.000Z";

export async function POST() {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (
    !staff ||
    (staff.role !== "director" && staff.role !== "creator")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  // Find lessons needing confirmations:
  // confirmation_sent_at <= now AND confirmed_by_member is null AND status is confirmed
  const { data: lessons, error } = await supabase
    .from("private_lessons")
    .select(
      `
      *,
      member:profiles!private_lessons_member_id_fkey(first_name, last_name)
      `
    )
    .eq("status", "confirmed")
    .is("confirmed_by_member", null)
    .lte("confirmation_sent_at", now)
    .neq("confirmation_sent_at", SENT_SENTINEL);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const serviceClient = createServiceClient();
  let sentCount = 0;

  for (const lesson of lessons ?? []) {
    const member = lesson.member as {
      first_name: string;
      last_name: string;
    } | null;

    if (!member) continue;

    await sendLessonConfirmationRequest(lesson, member);

    // Mark as sent with sentinel value
    await serviceClient
      .from("private_lessons")
      .update({ confirmation_sent_at: SENT_SENTINEL })
      .eq("id", lesson.id);

    sentCount++;
  }

  return NextResponse.json({ confirmations_sent: sentCount });
}
