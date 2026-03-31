import { createClient } from "@/lib/supabase/server";
import { requireStaffUser, withApiErrorHandling } from "@/lib/api";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();
    const { response } = await requireStaffUser(supabase, [
      "tennis_house",
      "director",
      "creator",
    ]);
    if (response) return response;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const { data: family, error: familyError } = await supabase
      .from("profiles")
      .select("*")
      .eq("audit_number", profile.audit_number)
      .order("is_child")
      .order("last_name");

    if (familyError) {
      return NextResponse.json({ error: familyError.message }, { status: 500 });
    }

    return NextResponse.json({ profile, family: family ?? [] });
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();
    const { response } = await requireStaffUser(supabase, ["director", "creator"]);
    if (response) return response;

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
  });
}
