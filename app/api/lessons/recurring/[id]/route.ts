import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["coach", "director", "creator"].includes(staff.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const serviceClient = createServiceClient();

  const { data: recurrence, error: recurrenceError } = await serviceClient
    .from("recurrences")
    .update({ active: false })
    .eq("id", id)
    .select()
    .single();

  if (recurrenceError) {
    return NextResponse.json(
      { error: recurrenceError.message },
      { status: 500 }
    );
  }

  const now = new Date().toISOString();

  const { data: cancelledLessons, error: cancelError } = await serviceClient
    .from("private_lessons")
    .update({ status: "cancelled" })
    .eq("recurrence_id", id)
    .gt("start_time", now)
    .neq("status", "cancelled")
    .select("id");

  if (cancelError) {
    return NextResponse.json({ error: cancelError.message }, { status: 500 });
  }

  return NextResponse.json({
    recurrence,
    cancelled_count: (cancelledLessons ?? []).length,
  });
}
