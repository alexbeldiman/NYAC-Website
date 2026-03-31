import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("coach_availability")
    .select(
      "*, coach:profiles!coach_availability_coach_id_fkey(first_name, last_name)"
    )
    .order("unavailable_from", { ascending: true });

  // Coaches see only their own rows; directors and creators see all
  if (staff.role === "coach") {
    query = query.eq("coach_id", staff.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
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
  const { unavailable_from, unavailable_to, reason } = body;

  if (!unavailable_from || !unavailable_to) {
    return NextResponse.json(
      { error: "unavailable_from and unavailable_to are required" },
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from("coach_availability")
    .insert({
      coach_id: staff.id,
      unavailable_from,
      unavailable_to,
      reason: reason ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
