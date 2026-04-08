import { createClient } from "@/lib/supabase/server";
import { requireStaffUser, withApiErrorHandling } from "@/lib/api";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();
    const { staff, response } = await requireStaffUser(supabase, [
      "coach",
      "director",
      "creator",
    ]);
    if (response || !staff) return response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const coach_id = searchParams.get("coach_id");

    let query = supabase
      .from("lesson_cancellation_reviews")
      .select(
        `
        *,
        lesson:private_lessons!lesson_cancellation_reviews_lesson_id_fkey(
          id,
          start_time,
          duration_minutes,
          status,
          coach_id,
          member:profiles!private_lessons_member_id_fkey(first_name, last_name, audit_number)
        )
        `
      )
      .order("created_at", { ascending: false });

    if (coach_id) {
      query = query.eq("lesson.coach_id", coach_id);
    } else if (staff.role === "coach") {
      query = query.eq("lesson.coach_id", staff.id);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  });
}
