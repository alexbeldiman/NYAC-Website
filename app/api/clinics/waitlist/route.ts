import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withApiErrorHandling } from "@/lib/api";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();

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
    .select("id")
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

  // 2. Verify slot is actually full
  const { data: slot, error: slotError } = await supabase
    .from("clinic_slots")
    .select("id, capacity")
    .eq("id", slot_id)
    .single();

  if (slotError || !slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  const { data: existingSignups, error: countError } = await supabase
    .from("clinic_signups")
    .select("id, guest_count")
    .eq("slot_id", slot_id)
    .eq("is_cancelled", false);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const currentTotal = (existingSignups ?? []).reduce(
    (sum, s) => sum + 1 + s.guest_count,
    0
  );

  if (currentTotal < slot.capacity) {
    return NextResponse.json(
      { error: "This session is not full yet. Please sign up normally." },
      { status: 400 }
    );
  }

  // 3. Check member not already on waitlist for this slot
  const { data: existingWaitlist } = await supabase
    .from("clinic_waitlist")
    .select("id")
    .eq("slot_id", slot_id)
    .eq("member_id", member.id)
    .maybeSingle();

  if (existingWaitlist) {
    return NextResponse.json(
      { error: "You are already on the waitlist for this session" },
      { status: 409 }
    );
  }

  // 4. Calculate waitlist_position
  const { data: maxPositionRows } = await supabase
    .from("clinic_waitlist")
    .select("waitlist_position")
    .eq("slot_id", slot_id)
    .order("waitlist_position", { ascending: false })
    .limit(1);

  const maxPosition =
    maxPositionRows && maxPositionRows.length > 0
      ? maxPositionRows[0].waitlist_position
      : 0;
  const newPosition = maxPosition + 1;

  // 5. Insert into clinic_waitlist
  const serviceClient = createServiceClient();

  const { data: waitlistEntry, error: insertError } = await serviceClient
    .from("clinic_waitlist")
    .insert({
      slot_id,
      member_id: member.id,
      last_name,
      audit_number,
      guest_count,
      guest_names,
      waitlist_position: newPosition,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

    return NextResponse.json(waitlistEntry, { status: 201 });
  });
}
