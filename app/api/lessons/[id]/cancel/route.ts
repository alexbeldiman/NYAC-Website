import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withApiErrorHandling } from "@/lib/api";
import {
  notifyCoachLessonCancelled,
  notifyCoachCancellationReview,
} from "@/lib/notifications";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();

  const body = await request.json();
  const { last_name, audit_number } = body;

  if (!last_name || !audit_number) {
    return NextResponse.json(
      { error: "last_name and audit_number are required" },
      { status: 400 }
    );
  }

  // Fetch the lesson with member and coach info
  const { data: lesson, error: lessonError } = await supabase
    .from("private_lessons")
    .select(
      `
      *,
      member:profiles!private_lessons_member_id_fkey(id, first_name, last_name, audit_number),
      coach:profiles!private_lessons_coach_id_fkey(id, first_name, last_name)
      `
    )
    .eq("id", params.id)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Verify member identity via profiles
  const member = lesson.member as {
    id: string;
    first_name: string;
    last_name: string;
    audit_number: string;
  } | null;

  if (
    !member ||
    member.audit_number !== audit_number ||
    member.last_name.toLowerCase() !== last_name.toLowerCase()
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Set lesson status to cancelled
  const { data: updatedLesson, error: updateError } = await serviceClient
    .from("private_lessons")
    .update({ status: "cancelled" })
    .eq("id", params.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Create cancellation review row
  const now = new Date();
  const autoResolveAt = new Date(now.getTime() + 24 * 3_600_000);

  const { data: review, error: reviewError } = await serviceClient
    .from("lesson_cancellation_reviews")
    .insert({
      lesson_id: params.id,
      cancelled_by_last_name: last_name,
      cancelled_by_audit_number: audit_number,
      cancelled_at: now.toISOString(),
      auto_resolve_at: autoResolveAt.toISOString(),
    })
    .select()
    .single();

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 });
  }

  const coach = lesson.coach as {
    id: string;
    first_name: string;
    last_name: string;
  } | null;

  // Determine pre-lesson or post-lesson cancel
  const lessonStart = new Date(lesson.start_time);
  const lessonEnd = new Date(
    lessonStart.getTime() + lesson.duration_minutes * 60_000
  );

  if (now < lessonStart && coach) {
    // Pre-lesson cancel
    await notifyCoachLessonCancelled(updatedLesson, coach);
  } else if (now > lessonEnd && coach) {
    // Post-lesson cancel
    await notifyCoachCancellationReview(updatedLesson, coach);
  }

    return NextResponse.json({ lesson: updatedLesson, review });
  });
}
