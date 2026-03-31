import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { escalatePickupToDirector } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (
    !staff ||
    (staff.role !== "director" && staff.role !== "creator")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000).toISOString();

  // Find pickup requests that haven't been escalated, were notified > 2hr ago, and unclaimed
  const { data: pickups, error } = await supabase
    .from("pickup_requests")
    .select(
      `
      *,
      lesson:private_lessons!inner(
        start_time,
        member:profiles!private_lessons_member_id_fkey(first_name, last_name)
      )
      `
    )
    .eq("escalated_to_director", false)
    .is("claimed_by", null)
    .lt("notified_coaches_at", twoHoursAgo);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get director info for notifications
  const { data: directors } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .in("role", ["director", "creator"])
    .limit(1);

  const director = directors && directors.length > 0
    ? directors[0]
    : { first_name: "Director", last_name: "" };

  let escalatedCount = 0;

  for (const pickup of pickups ?? []) {
    const now = new Date().toISOString();

    const { error: updateError } = await serviceClient
      .from("pickup_requests")
      .update({
        escalated_to_director: true,
        escalated_at: now,
      })
      .eq("id", pickup.id);

    if (updateError) {
      console.error(
        `escalate: failed to update pickup ${pickup.id}`,
        updateError.message
      );
      continue;
    }

    const lesson = pickup.lesson as {
      start_time: string;
      member: { first_name: string; last_name: string } | null;
    };

    const member = lesson.member ?? {
      first_name: "Unknown",
      last_name: "Member",
    };

    await escalatePickupToDirector(
      { start_time: lesson.start_time },
      member,
      director
    );

    escalatedCount++;
  }

  return NextResponse.json({ escalated_count: escalatedCount });
}
