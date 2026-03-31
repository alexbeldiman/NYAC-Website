// session_id values are synthetic — in production these come from mitl_academy_sessions table
// child_id values reference child MEMBERS in members.ts
// checked_in_by values reference COACHES in coaches.ts

export type MitlAttendanceRecord = {
  id: string;
  session_id: string;
  child_id: string;
  date: string;
  checked_in_by: string;
  age_exception: boolean;
  checked_in_at: string;
};

// Synthetic session IDs (would come from mitl_academy_sessions in prod)
const MITL_MON = "aaaa0000-0001-4000-8000-000000000001";   // MITL Mon 3:30–5pm
const MITL_WED = "aaaa0000-0002-4000-8000-000000000002";   // MITL Wed 3:30–5pm
const MITL_FRI = "aaaa0000-0003-4000-8000-000000000003";   // MITL Fri 3:30–5pm
const ACAD_TUE = "aaaa0000-0004-4000-8000-000000000004";   // Academy Tue 4–5:30pm
const ACAD_THU = "aaaa0000-0005-4000-8000-000000000005";   // Academy Thu 4–5:30pm

export const MITL_ATTENDANCE: MitlAttendanceRecord[] = [
  /* ── Monday — MITL ─────────────────────────────────────────── */
  {
    id: "d0e1f2a3-1001-4b4c-5d6e-f0a1b2c31001",
    session_id: MITL_MON,
    child_id: "b2c3d4e5-0005-4f6a-9b0c-d2e3f4a50005",     // Sophie Thornton (13)
    date: "2026-03-30",
    checked_in_by: "a1b2c3d4-0003-4e5f-8a9b-c1d2e3f40003", // James Okafor
    age_exception: false,
    checked_in_at: "2026-03-30T15:28:00-04:00",
  },
  {
    id: "d0e1f2a3-1002-4b4c-5d6e-f0a1b2c31002",
    session_id: MITL_MON,
    child_id: "b2c3d4e5-0006-4f6a-9b0c-d2e3f4a50006",     // Liam Thornton (11)
    date: "2026-03-30",
    checked_in_by: "a1b2c3d4-0003-4e5f-8a9b-c1d2e3f40003", // James Okafor
    age_exception: false,
    checked_in_at: "2026-03-30T15:30:00-04:00",
  },

  /* ── Tuesday — Academy ─────────────────────────────────────── */
  {
    id: "d0e1f2a3-1003-4b4c-5d6e-f0a1b2c31003",
    session_id: ACAD_TUE,
    child_id: "b2c3d4e5-0014-4f6a-9b0c-d2e3f4a50014",     // Diego Castillo (15)
    date: "2026-03-31",
    checked_in_by: "a1b2c3d4-0004-4e5f-8a9b-c1d2e3f40004", // Priya Nair
    age_exception: false,
    checked_in_at: "2026-03-31T15:55:00-04:00",
  },
  {
    id: "d0e1f2a3-1004-4b4c-5d6e-f0a1b2c31004",
    session_id: ACAD_TUE,
    child_id: "b2c3d4e5-0017-4f6a-9b0c-d2e3f4a50017",     // Nora Brennan (11)
    date: "2026-03-31",
    checked_in_by: "a1b2c3d4-0004-4e5f-8a9b-c1d2e3f40004", // Priya Nair
    age_exception: false,
    checked_in_at: "2026-03-31T16:02:00-04:00",
  },

  /* ── Wednesday — MITL ──────────────────────────────────────── */
  {
    id: "d0e1f2a3-1005-4b4c-5d6e-f0a1b2c31005",
    session_id: MITL_WED,
    child_id: "b2c3d4e5-0009-4f6a-9b0c-d2e3f4a50009",     // Mia Park (12)
    date: "2026-04-01",
    checked_in_by: "a1b2c3d4-0005-4e5f-8a9b-c1d2e3f40005", // David Chen
    age_exception: false,
    checked_in_at: "2026-04-01T15:25:00-04:00",
  },
  {
    id: "d0e1f2a3-1006-4b4c-5d6e-f0a1b2c31006",
    session_id: MITL_WED,
    child_id: "b2c3d4e5-0015-4f6a-9b0c-d2e3f4a50015",     // Isabella Castillo (9) — AGE EXCEPTION
    date: "2026-04-01",
    checked_in_by: "a1b2c3d4-0005-4e5f-8a9b-c1d2e3f40005", // David Chen
    age_exception: true,
    checked_in_at: "2026-04-01T15:30:00-04:00",
  },

  /* ── Thursday — Academy ────────────────────────────────────── */
  {
    id: "d0e1f2a3-1007-4b4c-5d6e-f0a1b2c31007",
    session_id: ACAD_THU,
    child_id: "b2c3d4e5-0014-4f6a-9b0c-d2e3f4a50014",     // Diego Castillo (15)
    date: "2026-04-02",
    checked_in_by: "a1b2c3d4-0006-4e5f-8a9b-c1d2e3f40006", // Elena Marchetti
    age_exception: false,
    checked_in_at: "2026-04-02T15:58:00-04:00",
  },

  /* ── Friday — MITL ─────────────────────────────────────────── */
  {
    id: "d0e1f2a3-1008-4b4c-5d6e-f0a1b2c31008",
    session_id: MITL_FRI,
    child_id: "b2c3d4e5-0005-4f6a-9b0c-d2e3f4a50005",     // Sophie Thornton (13)
    date: "2026-04-03",
    checked_in_by: "a1b2c3d4-0001-4e5f-8a9b-c1d2e3f40001", // Marco Reyes
    age_exception: false,
    checked_in_at: "2026-04-03T15:32:00-04:00",
  },
];
