import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import {
  notifyClinicSignupCreated,
  notifyWaitlistPromotion,
} from "@/lib/notifications";
import { NextResponse, type NextRequest } from "next/server";

async function cancelSignup(
  signupId: string,
  slotId: string,
  slotStartTime: string | null
) {
  const serviceClient = createServiceClient();

  const now = new Date();
  let late_cancel = false;

  // Check if current time is after slot start time + 15 minutes
  if (slotStartTime) {
    const slotStart = new Date(slotStartTime);
    const cutoff = new Date(slotStart.getTime() + 15 * 60_000);
    if (now > cutoff) {
      late_cancel = true;
    }
  }

  // Soft-delete: set is_cancelled, cancelled_at, and late_cancel
  const { data: updatedSignup, error: updateError } = await serviceClient
    .from("clinic_signups")
    .update({
      is_cancelled: true,
      cancelled_at: now.toISOString(),
      late_cancel,
    })
    .eq("id", signupId)
    .select()
    .single();

  if (updateError) {
    return { error: updateError.message, status: 500 };
  }

  // Check waitlist for this slot
  let waitlist_promoted = false;
  const { data: waitlistEntries } = await serviceClient
    .from("clinic_waitlist")
    .select("*")
    .eq("slot_id", slotId)
    .order("waitlist_position", { ascending: true })
    .limit(1);

  if (waitlistEntries && waitlistEntries.length > 0) {
    const entry = waitlistEntries[0];

    // Look up member_id from the waitlist entry's last_name + audit_number
    const { data: members } = await serviceClient
      .from("profiles")
      .select("id")
      .ilike("last_name", entry.last_name)
      .eq("audit_number", entry.audit_number)
      .eq("is_child", false);

    const memberId = members && members.length > 0 ? members[0].id : null;

    if (memberId) {
      // Insert a new signup for the promoted waitlister
      const { data: promotedSignup } = await serviceClient
        .from("clinic_signups")
        .insert({
          slot_id: slotId,
          member_id: memberId,
          guest_count: entry.guest_count ?? 0,
          guest_names: entry.guest_names ?? [],
          added_by: memberId,
        })
        .select("id, slot_id, guest_count")
        .single();

      if (promotedSignup) {
        const { data: promotedMember } = await serviceClient
          .from("profiles")
          .select("first_name, last_name, audit_number")
          .eq("id", memberId)
          .single();

        await notifyClinicSignupCreated({
          signup: promotedSignup,
          member: promotedMember ?? {
            first_name: "",
            last_name: entry.last_name,
            audit_number: entry.audit_number,
          },
        });
      }

      // Remove from waitlist
      await serviceClient
        .from("clinic_waitlist")
        .delete()
        .eq("id", entry.id);

      // Resequence remaining
      const { data: remaining } = await serviceClient
        .from("clinic_waitlist")
        .select("id, waitlist_position")
        .eq("slot_id", slotId)
        .gt("waitlist_position", entry.waitlist_position)
        .order("waitlist_position", { ascending: true });

      if (remaining) {
        for (const row of remaining) {
          await serviceClient
            .from("clinic_waitlist")
            .update({ waitlist_position: row.waitlist_position - 1 })
            .eq("id", row.id);
        }
      }

      await notifyWaitlistPromotion(entry);
      waitlist_promoted = true;
    }
  }

  return { signup: updatedSignup, waitlist_promoted };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  // Fetch the signup with slot info for late-cancel check
  const { data: signup, error: fetchError } = await supabase
    .from("clinic_signups")
    .select(
      "id, slot_id, member_id, profiles!clinic_signups_member_id_fkey(audit_number, last_name), clinic_slots!inner(start_time)"
    )
    .eq("id", params.id)
    .single();

  if (fetchError || !signup) {
    return NextResponse.json({ error: "Signup not found" }, { status: 404 });
  }

  const slotData = signup.clinic_slots as unknown as { start_time: string } | null;
  const slotStartTime = slotData?.start_time ?? null;

  // Check if staff
  const staff = await getStaffUser(supabase);
  const isStaff =
    staff &&
    (staff.role === "coach" ||
      staff.role === "director" ||
      staff.role === "creator");

  if (isStaff) {
    const result = await cancelSignup(params.id, signup.slot_id, slotStartTime);
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    return NextResponse.json(result);
  }

  // Non-staff: verify identity via last_name + audit_number
  const body = await request.json().catch(() => ({}));
  const { last_name, audit_number } = body;

  if (!last_name || !audit_number) {
    return NextResponse.json(
      { error: "last_name and audit_number are required" },
      { status: 401 }
    );
  }

  const profile = signup.profiles as unknown as {
    audit_number: string;
    last_name: string;
  } | null;

  if (
    !profile ||
    profile.audit_number !== audit_number ||
    profile.last_name.toLowerCase() !== last_name.toLowerCase()
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await cancelSignup(params.id, signup.slot_id, slotStartTime);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result);
}
