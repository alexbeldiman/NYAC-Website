import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = request.nextUrl;
  const last_name = searchParams.get("last_name");
  const audit_number = searchParams.get("audit_number");

  if (!last_name || !audit_number) {
    return NextResponse.json(
      { error: "last_name and audit_number are required" },
      { status: 400 }
    );
  }

  // Verify the family exists
  const { data: family, error: familyError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("last_name", last_name)
    .eq("audit_number", audit_number);

  if (familyError) {
    return NextResponse.json({ error: familyError.message }, { status: 500 });
  }

  if (!family || family.length === 0) {
    return NextResponse.json(
      {
        error:
          "We couldn't find your information. Please check your details or speak to someone at the tennis house.",
      },
      { status: 404 }
    );
  }

  const memberIds = family.map((f) => f.id);

  // Fetch all lessons for these members
  const { data: lessons, error: lessonError } = await supabase
    .from("private_lessons")
    .select(
      `
      *,
      member:profiles!private_lessons_member_id_fkey(first_name, last_name),
      coach:profiles!private_lessons_coach_id_fkey(first_name, last_name)
      `
    )
    .in("member_id", memberIds)
    .order("start_time");

  if (lessonError) {
    return NextResponse.json({ error: lessonError.message }, { status: 500 });
  }

  const now = new Date();
  const upcoming: typeof lessons = [];
  const past: typeof lessons = [];

  for (const lesson of lessons ?? []) {
    const startTime = new Date(lesson.start_time);
    if (
      startTime >= now &&
      (lesson.status === "confirmed" || lesson.status === "pending_pickup")
    ) {
      upcoming.push(lesson);
    } else {
      past.push(lesson);
    }
  }

  // upcoming: ascending by start_time (already sorted)
  // past: descending by start_time
  past.reverse();

  return NextResponse.json({ upcoming, past });
}
