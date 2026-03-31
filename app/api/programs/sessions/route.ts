import { createClient } from "@/lib/supabase/server";
import { requireStaffUser, withApiErrorHandling } from "@/lib/api";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();
    const { response } = await requireStaffUser(supabase, [
      "coach",
      "director",
      "creator",
    ]);
    if (response) return response;

    const { searchParams } = request.nextUrl;
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "date query param is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

    const { data: sessions, error: sessionsError } = await supabase
      .from("mitl_academy_sessions")
      .select("*")
      .eq("day_of_week", dayOfWeek)
      .order("program")
      .order("start_time");

    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json([]);
    }

    const sessionIds = sessions.map((s) => s.id);

    const { data: attendanceRows, error: attendanceError } = await supabase
      .from("mitl_academy_attendance")
      .select(
        `
        *,
        child:profiles!mitl_academy_attendance_child_id_fkey(first_name, last_name, audit_number, date_of_birth)
        `
      )
      .in("session_id", sessionIds)
      .eq("date", date);

    if (attendanceError) {
      return NextResponse.json({ error: attendanceError.message }, { status: 500 });
    }

    const attendanceBySession = (attendanceRows ?? []).reduce<
      Record<string, typeof attendanceRows>
    >((acc, row) => {
      if (!acc[row.session_id]) acc[row.session_id] = [];
      acc[row.session_id]!.push(row);
      return acc;
    }, {});

    const result = sessions.map((session) => ({
      ...session,
      attendance: attendanceBySession[session.id] ?? [],
    }));

    return NextResponse.json(result);
  });
}
