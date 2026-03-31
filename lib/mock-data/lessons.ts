// coach_id values reference COACHES in coaches.ts
// member_id / booked_by_id values reference MEMBERS in members.ts
// court_id values reference COURTS in courts.ts

export type Lesson = {
  id: string;
  member_id: string;
  booked_by_id: string;
  coach_id: string | null;
  start_time: string;
  duration_minutes: number;
  status: "confirmed" | "pending_pickup" | "cancelled" | "completed";
  is_recurring: boolean;
  recurrence_id: string | null;
  court_id: string | null;
  booked_via: "member_app" | "tennis_house" | "coach";
  confirmation_sent_at: string | null;
  confirmed_by_member: boolean | null;
  created_at: string;
};

export const LESSONS: Lesson[] = [
  /* ── 1. Confirmed — Marco Reyes + Catherine Harlow (Mon) ───── */
  {
    id: "e5f6a7b8-0001-4c9d-0e1f-a5b6c7d80001",
    member_id: "b2c3d4e5-0001-4f6a-9b0c-d2e3f4a50001",   // Catherine Harlow
    booked_by_id: "b2c3d4e5-0001-4f6a-9b0c-d2e3f4a50001",
    coach_id: "a1b2c3d4-0001-4e5f-8a9b-c1d2e3f40001",     // Marco Reyes
    start_time: "2026-03-30T08:00:00-04:00",
    duration_minutes: 60,
    status: "confirmed",
    is_recurring: false,
    recurrence_id: null,
    court_id: null,
    booked_via: "member_app",
    confirmation_sent_at: "2026-03-29T14:00:00-04:00",
    confirmed_by_member: true,
    created_at: "2026-03-28T10:15:00-04:00",
  },

  /* ── 2. Confirmed — Sandra Volkova + Robert Fenwick (Mon) ──── */
  {
    id: "e5f6a7b8-0002-4c9d-0e1f-a5b6c7d80002",
    member_id: "b2c3d4e5-0002-4f6a-9b0c-d2e3f4a50002",   // Robert Fenwick
    booked_by_id: "b2c3d4e5-0002-4f6a-9b0c-d2e3f4a50002",
    coach_id: "a1b2c3d4-0002-4e5f-8a9b-c1d2e3f40002",     // Sandra Volkova
    start_time: "2026-03-30T09:00:00-04:00",
    duration_minutes: 60,
    status: "confirmed",
    is_recurring: false,
    recurrence_id: null,
    court_id: null,
    booked_via: "member_app",
    confirmation_sent_at: "2026-03-29T14:05:00-04:00",
    confirmed_by_member: true,
    created_at: "2026-03-28T11:30:00-04:00",
  },

  /* ── 3. Confirmed — James Okafor + Sophie Thornton (Tue) ───── */
  {
    id: "e5f6a7b8-0003-4c9d-0e1f-a5b6c7d80003",
    member_id: "b2c3d4e5-0005-4f6a-9b0c-d2e3f4a50005",   // Sophie Thornton (child)
    booked_by_id: "b2c3d4e5-0004-4f6a-9b0c-d2e3f4a50004", // Michael Thornton (parent)
    coach_id: "a1b2c3d4-0003-4e5f-8a9b-c1d2e3f40003",     // James Okafor
    start_time: "2026-03-31T10:00:00-04:00",
    duration_minutes: 30,
    status: "confirmed",
    is_recurring: false,
    recurrence_id: null,
    court_id: null,
    booked_via: "member_app",
    confirmation_sent_at: "2026-03-30T09:00:00-04:00",
    confirmed_by_member: true,
    created_at: "2026-03-29T08:00:00-04:00",
  },

  /* ── 4. Confirmed — Priya Nair + Aisha Diallo (Tue) ───────── */
  {
    id: "e5f6a7b8-0004-4c9d-0e1f-a5b6c7d80004",
    member_id: "b2c3d4e5-0003-4f6a-9b0c-d2e3f4a50003",   // Aisha Diallo
    booked_by_id: "b2c3d4e5-0003-4f6a-9b0c-d2e3f4a50003",
    coach_id: "a1b2c3d4-0004-4e5f-8a9b-c1d2e3f40004",     // Priya Nair
    start_time: "2026-03-31T14:00:00-04:00",
    duration_minutes: 60,
    status: "confirmed",
    is_recurring: false,
    recurrence_id: null,
    court_id: null,
    booked_via: "member_app",
    confirmation_sent_at: "2026-03-30T09:15:00-04:00",
    confirmed_by_member: true,
    created_at: "2026-03-29T12:00:00-04:00",
  },

  /* ── 5. Confirmed — David Chen + Jin Park (Wed) ───────────── */
  {
    id: "e5f6a7b8-0005-4c9d-0e1f-a5b6c7d80005",
    member_id: "b2c3d4e5-0008-4f6a-9b0c-d2e3f4a50008",   // Jin Park
    booked_by_id: "b2c3d4e5-0008-4f6a-9b0c-d2e3f4a50008",
    coach_id: "a1b2c3d4-0005-4e5f-8a9b-c1d2e3f40005",     // David Chen
    start_time: "2026-04-01T08:30:00-04:00",
    duration_minutes: 60,
    status: "confirmed",
    is_recurring: false,
    recurrence_id: null,
    court_id: null,
    booked_via: "member_app",
    confirmation_sent_at: "2026-03-31T10:00:00-04:00",
    confirmed_by_member: true,
    created_at: "2026-03-30T07:45:00-04:00",
  },

  /* ── 6. Confirmed — Elena Marchetti + Rafael Castillo (Wed) ── */
  {
    id: "e5f6a7b8-0006-4c9d-0e1f-a5b6c7d80006",
    member_id: "b2c3d4e5-0013-4f6a-9b0c-d2e3f4a50013",   // Rafael Castillo
    booked_by_id: "b2c3d4e5-0013-4f6a-9b0c-d2e3f4a50013",
    coach_id: "a1b2c3d4-0006-4e5f-8a9b-c1d2e3f40006",     // Elena Marchetti
    start_time: "2026-04-01T11:00:00-04:00",
    duration_minutes: 60,
    status: "confirmed",
    is_recurring: false,
    recurrence_id: null,
    court_id: null,
    booked_via: "tennis_house",
    confirmation_sent_at: "2026-03-31T11:00:00-04:00",
    confirmed_by_member: true,
    created_at: "2026-03-30T09:30:00-04:00",
  },

  /* ── 7. Pending pickup — no coach, Gregory Brennan (Thu) ───── */
  {
    id: "e5f6a7b8-0007-4c9d-0e1f-a5b6c7d80007",
    member_id: "b2c3d4e5-0016-4f6a-9b0c-d2e3f4a50016",   // Gregory Brennan
    booked_by_id: "b2c3d4e5-0016-4f6a-9b0c-d2e3f4a50016",
    coach_id: null,
    start_time: "2026-04-02T09:00:00-04:00",
    duration_minutes: 60,
    status: "pending_pickup",
    is_recurring: false,
    recurrence_id: null,
    court_id: null,
    booked_via: "member_app",
    confirmation_sent_at: null,
    confirmed_by_member: null,
    created_at: "2026-03-31T16:00:00-04:00",
  },

  /* ── 8. Pending pickup — no coach, Catherine Harlow (Fri) ──── */
  {
    id: "e5f6a7b8-0008-4c9d-0e1f-a5b6c7d80008",
    member_id: "b2c3d4e5-0001-4f6a-9b0c-d2e3f4a50001",   // Catherine Harlow
    booked_by_id: "b2c3d4e5-0001-4f6a-9b0c-d2e3f4a50001",
    coach_id: null,
    start_time: "2026-04-03T15:00:00-04:00",
    duration_minutes: 90,
    status: "pending_pickup",
    is_recurring: false,
    recurrence_id: null,
    court_id: null,
    booked_via: "member_app",
    confirmation_sent_at: null,
    confirmed_by_member: null,
    created_at: "2026-04-01T12:00:00-04:00",
  },

  /* ── 9. Cancelled — Marco Reyes + Robert Fenwick (Thu) ─────── */
  {
    id: "e5f6a7b8-0009-4c9d-0e1f-a5b6c7d80009",
    member_id: "b2c3d4e5-0002-4f6a-9b0c-d2e3f4a50002",   // Robert Fenwick
    booked_by_id: "b2c3d4e5-0002-4f6a-9b0c-d2e3f4a50002",
    coach_id: "a1b2c3d4-0001-4e5f-8a9b-c1d2e3f40001",     // Marco Reyes
    start_time: "2026-04-02T14:00:00-04:00",
    duration_minutes: 60,
    status: "cancelled",
    is_recurring: false,
    recurrence_id: null,
    court_id: null,
    booked_via: "member_app",
    confirmation_sent_at: "2026-04-01T10:00:00-04:00",
    confirmed_by_member: true,
    created_at: "2026-03-31T09:00:00-04:00",
  },

  /* ── 10. Completed — Sandra Volkova + Aisha Diallo (Mon) ───── */
  {
    id: "e5f6a7b8-0010-4c9d-0e1f-a5b6c7d80010",
    member_id: "b2c3d4e5-0003-4f6a-9b0c-d2e3f4a50003",   // Aisha Diallo
    booked_by_id: "b2c3d4e5-0003-4f6a-9b0c-d2e3f4a50003",
    coach_id: "a1b2c3d4-0002-4e5f-8a9b-c1d2e3f40002",     // Sandra Volkova
    start_time: "2026-03-30T10:00:00-04:00",
    duration_minutes: 60,
    status: "completed",
    is_recurring: false,
    recurrence_id: null,
    court_id: null,
    booked_via: "member_app",
    confirmation_sent_at: "2026-03-29T14:10:00-04:00",
    confirmed_by_member: true,
    created_at: "2026-03-28T15:00:00-04:00",
  },

  /* ── 11. Confirmed recurring — Priya Nair + Mia Park (Wed) ── */
  {
    id: "e5f6a7b8-0011-4c9d-0e1f-a5b6c7d80011",
    member_id: "b2c3d4e5-0009-4f6a-9b0c-d2e3f4a50009",   // Mia Park (child)
    booked_by_id: "b2c3d4e5-0008-4f6a-9b0c-d2e3f4a50008", // Jin Park (parent)
    coach_id: "a1b2c3d4-0004-4e5f-8a9b-c1d2e3f40004",     // Priya Nair
    start_time: "2026-04-01T16:00:00-04:00",
    duration_minutes: 30,
    status: "confirmed",
    is_recurring: true,
    recurrence_id: "d0e1f2a3-0001-4b4c-5d6e-f0a1b2c30001",
    court_id: null,
    booked_via: "coach",
    confirmation_sent_at: "2026-03-31T12:00:00-04:00",
    confirmed_by_member: true,
    created_at: "2026-02-15T10:00:00-05:00",
  },

  /* ── 12. Confirmed with court — James Okafor + Jin Park (Fri) ─ */
  {
    id: "e5f6a7b8-0012-4c9d-0e1f-a5b6c7d80012",
    member_id: "b2c3d4e5-0008-4f6a-9b0c-d2e3f4a50008",   // Jin Park
    booked_by_id: "b2c3d4e5-0008-4f6a-9b0c-d2e3f4a50008",
    coach_id: "a1b2c3d4-0003-4e5f-8a9b-c1d2e3f40003",     // James Okafor
    start_time: "2026-04-03T10:00:00-04:00",
    duration_minutes: 90,
    status: "confirmed",
    is_recurring: false,
    recurrence_id: null,
    court_id: "d4e5f6a7-0016-4b8c-9d0e-f4a5b6c70016",     // Court 16 (pro)
    booked_via: "tennis_house",
    confirmation_sent_at: "2026-04-02T09:00:00-04:00",
    confirmed_by_member: true,
    created_at: "2026-04-01T14:00:00-04:00",
  },
];
