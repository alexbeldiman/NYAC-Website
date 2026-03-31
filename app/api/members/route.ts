import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("search") ?? "";

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`last_name.ilike.%${search}%,audit_number.eq.${search}`)
    .order("last_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const {
    first_name,
    last_name,
    audit_number,
    phone,
    role,
    is_child,
    gender,
    date_of_birth,
    parent_id,
  } = body;

  // Only directors and creators may assign a role
  const assignedRole =
    role !== undefined && (staff.role === "director" || staff.role === "creator")
      ? role
      : undefined;

  const insert: Record<string, unknown> = {
    first_name,
    last_name,
    audit_number,
    phone: phone ?? null,
    is_child: is_child ?? false,
    gender: gender ?? null,
    date_of_birth: date_of_birth ?? null,
    parent_id: parent_id ?? null,
  };

  if (assignedRole !== undefined) {
    insert.role = assignedRole;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert(insert)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
