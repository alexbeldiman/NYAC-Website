import { createClient } from "@/lib/supabase/server";
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
  const capacity = Number(body.capacity);

  if (!Number.isInteger(capacity) || capacity < 1) {
    return NextResponse.json(
      { error: "capacity must be a positive integer" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("clinic_slots")
    .update({ capacity })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
