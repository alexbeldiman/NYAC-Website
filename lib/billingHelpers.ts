// ---------------------------------------------------------------------------
// Shared grouping helpers used by billing routes and the programs billing route.
// ---------------------------------------------------------------------------

// ---- Clinics ---------------------------------------------------------------

export interface ClinicSession {
  date: string;
  hour: number;
  gender_restriction: string;
  guest_count: number;
}

export interface ClinicMemberEntry {
  member_name: string;
  total_sessions: number;
  total_guests: number;
  sessions: ClinicSession[];
}

export interface ClinicGroup {
  audit_number: string;
  members: ClinicMemberEntry[];
  total_sessions: number;
  total_guests: number;
}

interface ClinicRawRow {
  guest_count: number;
  slot: { date: string; hour: number; gender_restriction: string } | null;
  member: { first_name: string; last_name: string; audit_number: string } | null;
}

export function groupClinicRows(rows: ClinicRawRow[]): ClinicGroup[] {
  const groups = new Map<string, Map<string, ClinicMemberEntry>>();

  for (const row of rows) {
    if (!row.member || !row.slot) continue;
    const { audit_number, first_name, last_name } = row.member;
    const memberName = `${first_name} ${last_name}`;

    if (!groups.has(audit_number)) groups.set(audit_number, new Map());
    const memberMap = groups.get(audit_number)!;

    if (!memberMap.has(memberName)) {
      memberMap.set(memberName, {
        member_name: memberName,
        total_sessions: 0,
        total_guests: 0,
        sessions: [],
      });
    }

    const entry = memberMap.get(memberName)!;
    entry.total_sessions++;
    entry.total_guests += row.guest_count;
    entry.sessions.push({
      date: row.slot.date,
      hour: row.slot.hour,
      gender_restriction: row.slot.gender_restriction,
      guest_count: row.guest_count,
    });
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([audit_number, memberMap]) => {
      const members = Array.from(memberMap.values());
      return {
        audit_number,
        members,
        total_sessions: members.reduce((s, m) => s + m.total_sessions, 0),
        total_guests: members.reduce((s, m) => s + m.total_guests, 0),
      };
    });
}

// ---- Lessons ----------------------------------------------------------------

export interface LessonEntry {
  coach_name: string;
  date: string;
  duration_minutes: number;
}

export interface LessonMemberEntry {
  member_name: string;
  lessons: LessonEntry[];
}

export interface LessonGroup {
  audit_number: string;
  members: LessonMemberEntry[];
  total_lessons: number;
  total_minutes: number;
}

interface LessonRawRow {
  start_time: string;
  duration_minutes: number;
  member: { first_name: string; last_name: string; audit_number: string } | null;
  coach: { first_name: string; last_name: string } | null;
}

export function groupLessonRows(rows: LessonRawRow[]): LessonGroup[] {
  const groups = new Map<string, Map<string, LessonMemberEntry>>();
  const totals = new Map<string, { total_lessons: number; total_minutes: number }>();

  for (const row of rows) {
    if (!row.member) continue;
    const { audit_number, first_name, last_name } = row.member;
    const memberName = `${first_name} ${last_name}`;
    const coachName = row.coach
      ? `${row.coach.first_name} ${row.coach.last_name}`
      : "Unassigned";

    if (!groups.has(audit_number)) {
      groups.set(audit_number, new Map());
      totals.set(audit_number, { total_lessons: 0, total_minutes: 0 });
    }

    const memberMap = groups.get(audit_number)!;
    const tot = totals.get(audit_number)!;

    if (!memberMap.has(memberName)) {
      memberMap.set(memberName, { member_name: memberName, lessons: [] });
    }

    memberMap.get(memberName)!.lessons.push({
      coach_name: coachName,
      date: row.start_time.slice(0, 10),
      duration_minutes: row.duration_minutes,
    });
    tot.total_lessons++;
    tot.total_minutes += row.duration_minutes;
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([audit_number, memberMap]) => {
      const { total_lessons, total_minutes } = totals.get(audit_number)!;
      return {
        audit_number,
        members: Array.from(memberMap.values()),
        total_lessons,
        total_minutes,
      };
    });
}

// ---- MITL / Academy ---------------------------------------------------------

export interface MitlChildEntry {
  child_name: string;
  mitl_count: number;
  academy_count: number;
}

export interface MitlGroup {
  audit_number: string;
  members: MitlChildEntry[];
  total_mitl: number;
  total_academy: number;
}

interface MitlRawRow {
  session: { program: string; start_time: string } | null;
  child: { first_name: string; last_name: string; audit_number: string } | null;
}

export function groupMitlAcademyRows(rows: MitlRawRow[]): MitlGroup[] {
  const groups = new Map<string, Map<string, MitlChildEntry>>();

  for (const row of rows) {
    if (!row.child || !row.session) continue;
    const { audit_number, first_name, last_name } = row.child;
    const childName = `${first_name} ${last_name}`;

    if (!groups.has(audit_number)) groups.set(audit_number, new Map());
    const childMap = groups.get(audit_number)!;

    if (!childMap.has(childName)) {
      childMap.set(childName, { child_name: childName, mitl_count: 0, academy_count: 0 });
    }

    const entry = childMap.get(childName)!;
    if (row.session.program === "mitl") entry.mitl_count++;
    else if (row.session.program === "academy") entry.academy_count++;
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([audit_number, childMap]) => {
      const members = Array.from(childMap.values());
      return {
        audit_number,
        members,
        total_mitl: members.reduce((s, m) => s + m.mitl_count, 0),
        total_academy: members.reduce((s, m) => s + m.academy_count, 0),
      };
    });
}

// ---- Family name extraction -------------------------------------------------

export function extractFamilyNames(
  ...rowSets: Array<
    Array<{
      member?: { last_name: string; audit_number: string } | null;
      child?: { last_name: string; audit_number: string } | null;
    }>
  >
): Map<string, string> {
  const names = new Map<string, string>();
  for (const rows of rowSets) {
    for (const row of rows) {
      const profile = row.member ?? row.child;
      if (profile && !names.has(profile.audit_number)) {
        names.set(profile.audit_number, profile.last_name);
      }
    }
  }
  return names;
}
