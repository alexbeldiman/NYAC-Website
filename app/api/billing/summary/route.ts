import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import {
  groupClinicRows,
  groupLessonRows,
  groupMitlAcademyRows,
  extractFamilyNames,
} from "@/lib/billingHelpers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["director", "creator"].includes(staff.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const weekStart = searchParams.get("week_start");

  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json(
      { error: "week_start query param is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const weekStartDate = new Date(`${weekStart}T00:00:00Z`);
  if (weekStartDate.getUTCDay() !== 1) {
    return NextResponse.json(
      { error: "week_start must be a Monday" },
      { status: 400 }
    );
  }

  // Derived date strings
  const saturday = new Date(weekStartDate.getTime() + 5 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const sunday = new Date(weekStartDate.getTime() + 6 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const weekEndFri = new Date(weekStartDate.getTime() + 4 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const weekEndExclusive = new Date(weekStartDate.getTime() + 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  // Fire clinic slots, lessons, and MITL/academy in parallel
  const [slotsResult, lessonsResult, mitlResult] = await Promise.all([
    supabase
      .from("clinic_slots")
      .select("id, date, hour, gender_restriction")
      .in("date", [saturday, sunday]),

    supabase
      .from("private_lessons")
      .select(
        `
        start_time,
        duration_minutes,
        member:profiles!private_lessons_member_id_fkey(first_name, last_name, audit_number),
        coach:profiles!private_lessons_coach_id_fkey(first_name, last_name)
        `
      )
      .in("status", ["completed", "confirmed"])
      .gte("start_time", `${weekStart}T00:00:00Z`)
      .lt("start_time", `${weekEndExclusive}T00:00:00Z`)
      .order("start_time"),

    supabase
      .from("mitl_academy_attendance")
      .select(
        `
        session:mitl_academy_sessions!mitl_academy_attendance_session_id_fkey(program, start_time),
        child:profiles!mitl_academy_attendance_child_id_fkey(first_name, last_name, audit_number)
        `
      )
      .gte("date", weekStart)
      .lte("date", weekEndFri),
  ]);

  if (slotsResult.error) {
    return NextResponse.json(
      { error: slotsResult.error.message },
      { status: 500 }
    );
  }
  if (lessonsResult.error) {
    return NextResponse.json(
      { error: lessonsResult.error.message },
      { status: 500 }
    );
  }
  if (mitlResult.error) {
    return NextResponse.json(
      { error: mitlResult.error.message },
      { status: 500 }
    );
  }

  // Fetch clinic signups now that we have slot IDs
  const slots = slotsResult.data ?? [];
  const slotIds = slots.map((s) => s.id);
  const slotMap = new Map(slots.map((s) => [s.id, s]));

  let signups: Array<{
    slot_id: string;
    guest_count: number;
    member: { first_name: string; last_name: string; audit_number: string } | null;
  }> = [];

  if (slotIds.length > 0) {
    const { data: signupRows, error: signupsError } = await supabase
      .from("clinic_signups")
      .select(
        `
        slot_id,
        guest_count,
        member:profiles!clinic_signups_member_id_fkey(first_name, last_name, audit_number)
        `
      )
      .in("slot_id", slotIds);

    if (signupsError) {
      return NextResponse.json(
        { error: signupsError.message },
        { status: 500 }
      );
    }

    signups = (signupRows ?? []).map((r) => ({
      slot_id: r.slot_id,
      guest_count: r.guest_count,
      member: r.member as unknown as {
        first_name: string;
        last_name: string;
        audit_number: string;
      } | null,
    }));
  }

  // Build typed row arrays for the grouping helpers
  const clinicRows = signups.map((s) => ({
    guest_count: s.guest_count,
    slot: slotMap.get(s.slot_id) ?? null,
    member: s.member,
  }));

  const lessonRows = (lessonsResult.data ?? []).map((r) => ({
    start_time: r.start_time,
    duration_minutes: r.duration_minutes,
    member: r.member as unknown as {
      first_name: string;
      last_name: string;
      audit_number: string;
    } | null,
    coach: r.coach as unknown as { first_name: string; last_name: string } | null,
  }));

  const mitlRows = (mitlResult.data ?? []).map((r) => ({
    session: r.session as unknown as { program: string; start_time: string } | null,
    child: r.child as unknown as {
      first_name: string;
      last_name: string;
      audit_number: string;
    } | null,
  }));

  // Group each dataset
  const clinicGroups = groupClinicRows(clinicRows);
  const lessonGroups = groupLessonRows(lessonRows);
  const mitlGroups = groupMitlAcademyRows(mitlRows);

  // Index by audit_number for O(1) merging
  const clinicByAudit = new Map(clinicGroups.map((g) => [g.audit_number, g]));
  const lessonByAudit = new Map(lessonGroups.map((g) => [g.audit_number, g]));
  const mitlByAudit = new Map(mitlGroups.map((g) => [g.audit_number, g]));

  // Collect family last names from all datasets
  const familyNames = extractFamilyNames(
    clinicRows.map((r) => ({ member: r.member })),
    lessonRows.map((r) => ({ member: r.member })),
    mitlRows.map((r) => ({ child: r.child }))
  );

  // Union of all audit numbers
  const allAuditNumbers = new Set([
    ...Array.from(clinicByAudit.keys()),
    ...Array.from(lessonByAudit.keys()),
    ...Array.from(mitlByAudit.keys()),
  ]);

  const result = Array.from(allAuditNumbers)
    .sort((a, b) => a.localeCompare(b))
    .map((audit_number) => {
      const clinic = clinicByAudit.get(audit_number);
      const lesson = lessonByAudit.get(audit_number);
      const mitl = mitlByAudit.get(audit_number);

      return {
        audit_number,
        family_name: familyNames.get(audit_number) ?? "",
        clinics: {
          total_sessions: clinic?.total_sessions ?? 0,
          total_guests: clinic?.total_guests ?? 0,
          sessions: clinic?.members.flatMap((m) => m.sessions) ?? [],
        },
        lessons: {
          total_lessons: lesson?.total_lessons ?? 0,
          total_minutes: lesson?.total_minutes ?? 0,
          lessons: lesson?.members.flatMap((m) => m.lessons) ?? [],
        },
        mitl_academy: {
          members: mitl?.members ?? [],
          total_mitl: mitl?.total_mitl ?? 0,
          total_academy: mitl?.total_academy ?? 0,
        },
      };
    });

  return NextResponse.json(result);
}
