import { createClient } from "@/lib/supabase/server";
import { sendMemberDeclineNotification } from "@/lib/notifications";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const body = await request.json();
  const { last_name, audit_number, confirmed } = body;

  if (!last_name || !audit_number || typeof confirmed !== "boolean") {
    return NextResponse.json(
      { error: "last_name, audit_number, and confirmed (boolean) are required" },
      { status: 400 }
    );
  }

  // Fetch lesson with member profile
  const { data: lesson, error: lessonError } = await supabase
    .from("private_lessons")
    .select(
      "id, member_id, status, profiles!private_lessons_member_id_fkey(last_name, audit_number)"
    )
    .eq("id", params.id)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const profile = lesson.profiles as { last_name: string; audit_number: string } | null;

  if (
    !profile ||
    profile.audit_number !== audit_number ||
    profile.last_name.toLowerCase() !== last_name.toLowerCase()
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates: Record<string, unknown> = {
    confirmed_by_member: confirmed,
  };

  if (!confirmed) {
    updates.status = "cancelled";
  }

  const { data, error } = await supabase
    .from("private_lessons")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!confirmed && data.coach_id) {
    const { data: coach } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", data.coach_id)
      .single();

    if (coach) {
      await sendMemberDeclineNotification(data, coach);
    }
  }

  return NextResponse.json(data);
}
