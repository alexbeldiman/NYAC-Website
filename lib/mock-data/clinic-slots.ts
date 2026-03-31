export type ClinicSlot = {
  id: string;
  date: string;
  hour: number;
  gender_restriction: "men_only" | "women_only" | "mixed";
  capacity: number;
  access_code: string;
  code_generated_at: string;
  signed_up_count: number;
  is_full: boolean;
};

export const CLINIC_SLOTS: ClinicSlot[] = [
  /* ── Saturday 2026-04-04 ───────────────────────────────────── */

  {
    id: "c3d4e5f6-0001-4a7b-8c9d-e3f4a5b60001",
    date: "2026-04-04",
    hour: 8,
    gender_restriction: "men_only",
    capacity: 36,
    access_code: "MN8K4R",
    code_generated_at: "2026-04-04T06:00:00-04:00",
    signed_up_count: 18,
    is_full: false,
  },
  {
    id: "c3d4e5f6-0002-4a7b-8c9d-e3f4a5b60002",
    date: "2026-04-04",
    hour: 9,
    gender_restriction: "women_only",
    capacity: 36,
    access_code: "WF9T2L",
    code_generated_at: "2026-04-04T06:00:00-04:00",
    signed_up_count: 24,
    is_full: false,
  },
  {
    id: "c3d4e5f6-0003-4a7b-8c9d-e3f4a5b60003",
    date: "2026-04-04",
    hour: 10,
    gender_restriction: "mixed",
    capacity: 36,
    access_code: "MX3P7J",
    code_generated_at: "2026-04-04T06:00:00-04:00",
    signed_up_count: 36,
    is_full: true,
  },
  {
    id: "c3d4e5f6-0004-4a7b-8c9d-e3f4a5b60004",
    date: "2026-04-04",
    hour: 11,
    gender_restriction: "mixed",
    capacity: 36,
    access_code: "MX6H1N",
    code_generated_at: "2026-04-04T06:00:00-04:00",
    signed_up_count: 11,
    is_full: false,
  },

  /* ── Sunday 2026-04-05 ─────────────────────────────────────── */

  {
    id: "c3d4e5f6-0005-4a7b-8c9d-e3f4a5b60005",
    date: "2026-04-05",
    hour: 8,
    gender_restriction: "men_only",
    capacity: 36,
    access_code: "MN2V9Q",
    code_generated_at: "2026-04-05T06:00:00-04:00",
    signed_up_count: 14,
    is_full: false,
  },
  {
    id: "c3d4e5f6-0006-4a7b-8c9d-e3f4a5b60006",
    date: "2026-04-05",
    hour: 9,
    gender_restriction: "women_only",
    capacity: 36,
    access_code: "WF5B8D",
    code_generated_at: "2026-04-05T06:00:00-04:00",
    signed_up_count: 20,
    is_full: false,
  },
  {
    id: "c3d4e5f6-0007-4a7b-8c9d-e3f4a5b60007",
    date: "2026-04-05",
    hour: 10,
    gender_restriction: "mixed",
    capacity: 36,
    access_code: "MX7G3W",
    code_generated_at: "2026-04-05T06:00:00-04:00",
    signed_up_count: 28,
    is_full: false,
  },
  {
    id: "c3d4e5f6-0008-4a7b-8c9d-e3f4a5b60008",
    date: "2026-04-05",
    hour: 11,
    gender_restriction: "mixed",
    capacity: 36,
    access_code: "MX4R6Y",
    code_generated_at: "2026-04-05T06:00:00-04:00",
    signed_up_count: 9,
    is_full: false,
  },
];
