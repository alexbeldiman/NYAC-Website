import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const { data: family } = await supabase
    .from("profiles")
    .select("*")
    .eq("audit_number", profile.audit_number)
    .order("is_child")
    .order("last_name");

  return NextResponse.json({ profile, family: family ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (staff.role !== "director" && staff.role !== "creator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const allowed = [
    "first_name",
    "last_name",
    "audit_number",
    "phone",
    "role",
    "is_child",
    "gender",
    "date_of_birth",
    "parent_id",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
