import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  // Fetch the signup to get the member_id
  const { data: signup, error: fetchError } = await supabase
    .from("clinic_signups")
    .select("id, member_id, profiles!clinic_signups_member_id_fkey(audit_number, last_name)")
    .eq("id", params.id)
    .single();

  if (fetchError || !signup) {
    return NextResponse.json({ error: "Signup not found" }, { status: 404 });
  }

  // Check if staff
  const staff = await getStaffUser(supabase);
  const isStaff =
    staff &&
    (staff.role === "coach" ||
      staff.role === "director" ||
      staff.role === "creator");

  if (isStaff) {
    const { error } = await supabase
      .from("clinic_signups")
      .delete()
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return new NextResponse(null, { status: 204 });
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

  const profile = signup.profiles as { audit_number: string; last_name: string } | null;

  if (
    !profile ||
    profile.audit_number !== audit_number ||
    profile.last_name.toLowerCase() !== last_name.toLowerCase()
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("clinic_signups")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
