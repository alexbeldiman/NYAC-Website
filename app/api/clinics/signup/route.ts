import { createServiceClient } from "@/lib/supabase/server";
import { withApiErrorHandling } from "@/lib/api";
import { notifyClinicSignupCreated } from "@/lib/notifications";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const supabase = createServiceClient();

  const body = await request.json();
  const {
    slot_id,
    last_name,
    audit_number,
    member_id,
    guest_count = 0,
    guest_names = [],
  } = body;

  if (!slot_id || !last_name || !audit_number) {
    return NextResponse.json(
      { error: "slot_id, last_name, and audit_number are required" },
      { status: 400 }
    );
  }

  // 1. Verify the member exists
  let query = supabase
    .from("profiles")
    .select("id, first_name, last_name, audit_number, gender")
    .ilike("last_name", last_name)
    .eq("audit_number", audit_number)
    .eq("is_child", false);

  if (member_id) {
    query = query.eq("id", member_id);
  }

  const { data: members, error: memberError } = await query;

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  if (!members || members.length === 0) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const member = members[0];

  // 2. Fetch slot and check capacity + gender restriction
  const { data: slot, error: slotError } = await supabase
    .from("clinic_slots")
    .select("id, capacity, gender_restriction")
    .eq("id", slot_id)
    .single();

  if (slotError || !slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  // Check gender restriction — only block on an explicit mismatch; null gender is allowed through
  if (slot.gender_restriction === "men_only" && member.gender && member.gender !== "male") {
    return NextResponse.json(
      { error: "This session is for men only." },
      { status: 403 }
    );
  }
  if (slot.gender_restriction === "women_only" && member.gender && member.gender !== "female") {
    return NextResponse.json(
      { error: "This session is for women only." },
      { status: 403 }
    );
  }

  const { data: existingSignups, error: countError } = await supabase
    .from("clinic_signups")
    .select("id, guest_count")
    .eq("slot_id", slot_id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const currentTotal = (existingSignups ?? []).reduce(
    (sum, s) => sum + 1 + s.guest_count,
    0
  );

  if (currentTotal + 1 + guest_count > slot.capacity) {
    return NextResponse.json(
      { error: "This session is full" },
      { status: 409 }
    );
  }

  // 3. Check member is not already signed up
  const { data: duplicate } = await supabase
    .from("clinic_signups")
    .select("id")
    .eq("slot_id", slot_id)
    .eq("member_id", member.id)
    .eq("is_cancelled", false)
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json(
      { error: "You are already signed up for this session" },
      { status: 409 }
    );
  }

  // 4. Upsert signup — handles re-signup after cancellation
  const { data: signup, error: insertError } = await supabase
    .from("clinic_signups")
    .upsert(
      {
        slot_id,
        member_id: member.id,
        guest_count,
        guest_names,
        added_by: member.id,
        is_cancelled: false,
        cancelled_at: null,
        late_cancel: false,
      },
      { onConflict: "slot_id,member_id" }
    )
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await notifyClinicSignupCreated({
    signup: {
      id: signup.id,
      slot_id: signup.slot_id,
      guest_count: signup.guest_count,
    },
    member: {
      first_name: member.first_name,
      last_name: member.last_name,
      audit_number: member.audit_number,
    },
  });

    return NextResponse.json(signup, { status: 201 });
  });
}
