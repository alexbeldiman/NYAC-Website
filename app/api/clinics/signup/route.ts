import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const body = await request.json();
  const {
    slot_id,
    last_name,
    audit_number,
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
  const { data: members, error: memberError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("last_name", last_name)
    .eq("audit_number", audit_number)
    .eq("is_child", false);

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  if (!members || members.length === 0) {
    return NextResponse.json(
      {
        error:
          "We couldn't find your information. Please check your details or speak to someone at the tennis house.",
      },
      { status: 404 }
    );
  }

  const member = members[0];

  // 2. Fetch slot and check capacity
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
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json(
      { error: "You are already signed up for this session" },
      { status: 409 }
    );
  }

  // 4. Insert signup
  const { data: signup, error: insertError } = await supabase
    .from("clinic_signups")
    .insert({
      slot_id,
      member_id: member.id,
      guest_count,
      guest_names,
      added_by: member.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(signup, { status: 201 });
}
