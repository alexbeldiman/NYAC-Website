import { createServiceClient } from "@/lib/supabase/server";

function buildLessonStartTime(date: Date, startTime: string): Date {
  const [hours, minutes] = startTime.split(":").map(Number);
  const d = new Date(date);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

function computeConfirmationSentAt(lessonStart: Date): string {
  const now = new Date();
  const hoursUntilLesson = (lessonStart.getTime() - now.getTime()) / 3_600_000;
  return hoursUntilLesson > 24
    ? new Date(lessonStart.getTime() - 24 * 3_600_000).toISOString()
    : new Date(now.getTime() + 6 * 3_600_000).toISOString();
}

export async function extendRecurrences(): Promise<number> {
  const serviceClient = createServiceClient();

  const { data: recurrences, error } = await serviceClient
    .from("recurrences")
    .select("*")
    .eq("active", true);

  if (error) {
    console.error(
      "extendRecurrences: failed to fetch recurrences",
      error.message
    );
    return 0;
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let totalGenerated = 0;

  for (const recurrence of recurrences ?? []) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() + i * 86_400_000);
      if (date.getUTCDay() !== recurrence.day_of_week) continue;

      const dateStr = date.toISOString().slice(0, 10);
      const lessonStart = buildLessonStartTime(date, recurrence.start_time);
      const lessonEnd = new Date(
        lessonStart.getTime() + recurrence.duration_minutes * 60_000
      );

      // Skip if a lesson for this recurrence already exists on this date
      const { data: existing } = await serviceClient
        .from("private_lessons")
        .select("id")
        .eq("recurrence_id", recurrence.id)
        .gte("start_time", `${dateStr}T00:00:00.000Z`)
        .lt("start_time", `${dateStr}T24:00:00.000Z`);

      if ((existing ?? []).length > 0) continue;

      // Check coach conflict
      const { data: conflicts } = await serviceClient
        .from("private_lessons")
        .select("id, start_time, duration_minutes")
        .eq("coach_id", recurrence.coach_id)
        .neq("status", "cancelled")
        .lt("start_time", lessonEnd.toISOString())
        .gte(
          "start_time",
          new Date(lessonStart.getTime() - 120 * 60_000).toISOString()
        );

      const hasConflict = (conflicts ?? []).some((c) => {
        const existingStart = new Date(c.start_time).getTime();
        const existingEnd = existingStart + c.duration_minutes * 60_000;
        return (
          lessonStart.getTime() < existingEnd &&
          lessonEnd.getTime() > existingStart
        );
      });

      if (hasConflict) {
        console.log(
          `extendRecurrences: skipping recurrence ${recurrence.id} on ${dateStr} — coach conflict`
        );
        continue;
      }

      const confirmation_sent_at = computeConfirmationSentAt(lessonStart);

      const { data: lesson, error: lessonError } = await serviceClient
        .from("private_lessons")
        .insert({
          member_id: recurrence.member_id,
          booked_by_id: recurrence.coach_id,
          coach_id: recurrence.coach_id,
          start_time: lessonStart.toISOString(),
          duration_minutes: recurrence.duration_minutes,
          status: "confirmed",
          is_recurring: true,
          recurrence_id: recurrence.id,
          booked_via: "coach",
          confirmation_sent_at,
        })
        .select()
        .single();

      if (lessonError) {
        console.error(
          `extendRecurrences: failed to insert lesson for recurrence ${recurrence.id} on ${dateStr}`,
          lessonError.message
        );
        continue;
      }

      console.log(
        `extendRecurrences: generated lesson ${lesson.id} for recurrence ${recurrence.id} on ${dateStr} at ${recurrence.start_time}`
      );
      totalGenerated++;
    }
  }

  return totalGenerated;
}
