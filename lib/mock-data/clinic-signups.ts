// slot_id values reference CLINIC_SLOTS in clinic-slots.ts (Saturday slots only)
// member_id / added_by values reference adult MEMBERS in members.ts

export type ClinicSignup = {
  id: string;
  slot_id: string;
  member_id: string;
  guest_count: number;
  guest_names: string[];
  added_by: string;
  checked_in: boolean;
  signed_up_at: string;
  is_cancelled: boolean;
  cancelled_at: string | null;
  late_cancel: boolean;
};

export const CLINIC_SIGNUPS: ClinicSignup[] = [
  /* ── Saturday 8am — men_only (slot 0001) ───────────────────── */

  {
    id: "f6a7b8c9-0001-4d0e-1f2a-b6c7d8e90001",
    slot_id: "c3d4e5f6-0001-4a7b-8c9d-e3f4a5b60001",    // Sat 8am
    member_id: "b2c3d4e5-0002-4f6a-9b0c-d2e3f4a50002",   // Robert Fenwick
    guest_count: 0,
    guest_names: [],
    added_by: "b2c3d4e5-0002-4f6a-9b0c-d2e3f4a50002",
    checked_in: false,
    signed_up_at: "2026-04-03T19:22:00-04:00",
    is_cancelled: false,
    cancelled_at: null,
    late_cancel: false,
  },
  {
    id: "f6a7b8c9-0002-4d0e-1f2a-b6c7d8e90002",
    slot_id: "c3d4e5f6-0001-4a7b-8c9d-e3f4a5b60001",    // Sat 8am
    member_id: "b2c3d4e5-0004-4f6a-9b0c-d2e3f4a50004",   // Michael Thornton
    guest_count: 1,
    guest_names: ["Steve Thornton"],
    added_by: "b2c3d4e5-0004-4f6a-9b0c-d2e3f4a50004",
    checked_in: false,
    signed_up_at: "2026-04-03T20:05:00-04:00",
    is_cancelled: false,
    cancelled_at: null,
    late_cancel: false,
  },
  {
    id: "f6a7b8c9-0003-4d0e-1f2a-b6c7d8e90003",
    slot_id: "c3d4e5f6-0001-4a7b-8c9d-e3f4a5b60001",    // Sat 8am
    member_id: "b2c3d4e5-0016-4f6a-9b0c-d2e3f4a50016",   // Gregory Brennan
    guest_count: 0,
    guest_names: [],
    added_by: "b2c3d4e5-0016-4f6a-9b0c-d2e3f4a50016",
    checked_in: false,
    signed_up_at: "2026-04-03T21:30:00-04:00",
    is_cancelled: false,
    cancelled_at: null,
    late_cancel: false,
  },

  /* ── Saturday 9am — women_only (slot 0002) ─────────────────── */

  {
    id: "f6a7b8c9-0004-4d0e-1f2a-b6c7d8e90004",
    slot_id: "c3d4e5f6-0002-4a7b-8c9d-e3f4a5b60002",    // Sat 9am
    member_id: "b2c3d4e5-0001-4f6a-9b0c-d2e3f4a50001",   // Catherine Harlow
    guest_count: 0,
    guest_names: [],
    added_by: "b2c3d4e5-0001-4f6a-9b0c-d2e3f4a50001",
    checked_in: false,
    signed_up_at: "2026-04-03T18:45:00-04:00",
    is_cancelled: false,
    cancelled_at: null,
    late_cancel: false,
  },
  {
    id: "f6a7b8c9-0005-4d0e-1f2a-b6c7d8e90005",
    slot_id: "c3d4e5f6-0002-4a7b-8c9d-e3f4a5b60002",    // Sat 9am
    member_id: "b2c3d4e5-0003-4f6a-9b0c-d2e3f4a50003",   // Aisha Diallo
    guest_count: 0,
    guest_names: [],
    added_by: "b2c3d4e5-0003-4f6a-9b0c-d2e3f4a50003",
    checked_in: false,
    signed_up_at: "2026-04-03T19:10:00-04:00",
    is_cancelled: false,
    cancelled_at: null,
    late_cancel: false,
  },

  /* ── Saturday 10am — mixed / FULL (slot 0003) ──────────────── */

  {
    id: "f6a7b8c9-0006-4d0e-1f2a-b6c7d8e90006",
    slot_id: "c3d4e5f6-0003-4a7b-8c9d-e3f4a5b60003",    // Sat 10am
    member_id: "b2c3d4e5-0008-4f6a-9b0c-d2e3f4a50008",   // Jin Park
    guest_count: 0,
    guest_names: [],
    added_by: "b2c3d4e5-0008-4f6a-9b0c-d2e3f4a50008",
    checked_in: false,
    signed_up_at: "2026-04-03T17:30:00-04:00",
    is_cancelled: false,
    cancelled_at: null,
    late_cancel: false,
  },
  {
    id: "f6a7b8c9-0007-4d0e-1f2a-b6c7d8e90007",
    slot_id: "c3d4e5f6-0003-4a7b-8c9d-e3f4a5b60003",    // Sat 10am
    member_id: "b2c3d4e5-0013-4f6a-9b0c-d2e3f4a50013",   // Rafael Castillo
    guest_count: 0,
    guest_names: [],
    added_by: "b2c3d4e5-0013-4f6a-9b0c-d2e3f4a50013",
    checked_in: false,
    signed_up_at: "2026-04-03T18:00:00-04:00",
    is_cancelled: false,
    cancelled_at: null,
    late_cancel: false,
  },

  /* ── Saturday 11am — mixed (slot 0004) ─────────────────────── */

  {
    id: "f6a7b8c9-0008-4d0e-1f2a-b6c7d8e90008",
    slot_id: "c3d4e5f6-0004-4a7b-8c9d-e3f4a5b60004",    // Sat 11am
    member_id: "b2c3d4e5-0001-4f6a-9b0c-d2e3f4a50001",   // Catherine Harlow
    guest_count: 0,
    guest_names: [],
    added_by: "b2c3d4e5-0001-4f6a-9b0c-d2e3f4a50001",
    checked_in: false,
    signed_up_at: "2026-04-03T18:46:00-04:00",
    is_cancelled: false,
    cancelled_at: null,
    late_cancel: false,
  },
  {
    id: "f6a7b8c9-0009-4d0e-1f2a-b6c7d8e90009",
    slot_id: "c3d4e5f6-0004-4a7b-8c9d-e3f4a5b60004",    // Sat 11am
    member_id: "b2c3d4e5-0002-4f6a-9b0c-d2e3f4a50002",   // Robert Fenwick
    guest_count: 0,
    guest_names: [],
    added_by: "b2c3d4e5-0002-4f6a-9b0c-d2e3f4a50002",
    checked_in: false,
    signed_up_at: "2026-04-03T19:30:00-04:00",
    is_cancelled: false,
    cancelled_at: null,
    late_cancel: false,
  },
  {
    id: "f6a7b8c9-0010-4d0e-1f2a-b6c7d8e90010",
    slot_id: "c3d4e5f6-0004-4a7b-8c9d-e3f4a5b60004",    // Sat 11am
    member_id: "b2c3d4e5-0016-4f6a-9b0c-d2e3f4a50016",   // Gregory Brennan
    guest_count: 0,
    guest_names: [],
    added_by: "b2c3d4e5-0016-4f6a-9b0c-d2e3f4a50016",
    checked_in: false,
    signed_up_at: "2026-04-03T21:45:00-04:00",
    is_cancelled: false,
    cancelled_at: null,
    late_cancel: false,
  },
];
