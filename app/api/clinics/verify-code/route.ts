import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const body = await request.json();
  const { code, slot_id } = body;

  if (!code || !slot_id) {
    return NextResponse.json(
      { error: "code and slot_id are required" },
      { status: 400 }
    );
  }

  const { data: slot, error } = await supabase
    .from("clinic_slots")
    .select("access_code")
    .eq("id", slot_id)
    .single();

  if (error || !slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  if (
    !slot.access_code ||
    slot.access_code.toLowerCase() !== code.toLowerCase()
  ) {
    return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
