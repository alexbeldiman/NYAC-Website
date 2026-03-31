import { createClient, createServiceClient } from "@/lib/supabase/server";
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
    (staff.role !== "tennis_house" &&
      staff.role !== "director" &&
      staff.role !== "creator")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { court_id } = body;

  if (!court_id) {
    return NextResponse.json(
      { error: "court_id is required" },
      { status: 400 }
    );
  }

  // Verify the court exists
  const { data: court, error: courtError } = await supabase
    .from("courts")
    .select("id")
    .eq("id", court_id)
    .single();

  if (courtError || !court) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  const serviceClient = createServiceClient();

  const { data: lesson, error: updateError } = await serviceClient
    .from("private_lessons")
    .update({ court_id })
    .eq("id", params.id)
    .select(
      `
      *,
      member:profiles!private_lessons_member_id_fkey(first_name, last_name),
      coach:profiles!private_lessons_coach_id_fkey(first_name, last_name)
      `
    )
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  return NextResponse.json(lesson);
}
