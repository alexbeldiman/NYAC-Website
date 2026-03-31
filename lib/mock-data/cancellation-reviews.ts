// lesson_id values reference LESSONS in lessons.ts
// cancelled_by fields reference MEMBERS in members.ts

export type CancellationReview = {
  id: string;
  lesson_id: string;
  cancelled_by_last_name: string;
  cancelled_by_audit_number: string;
  cancelled_at: string;
  coach_response: boolean | null;
  coach_responded_at: string | null;
  auto_resolved: boolean;
  auto_resolve_at: string | null;
  created_at: string;
};

export const CANCELLATION_REVIEWS: CancellationReview[] = [
  /* ── 1. Pre-lesson cancel — pending coach review ───────────── */
  {
    id: "b8c9d0e1-0001-4f2a-3b4c-d8e9f0a10001",
    lesson_id: "e5f6a7b8-0009-4c9d-0e1f-a5b6c7d80009",   // Cancelled lesson — Robert Fenwick / Marco Reyes (Thu)
    cancelled_by_last_name: "Fenwick",
    cancelled_by_audit_number: "2187",
    cancelled_at: "2026-04-01T22:30:00-04:00",
    coach_response: null,
    coach_responded_at: null,
    auto_resolved: false,
    auto_resolve_at: "2026-04-04T22:30:00-04:00",          // 72h deadline
    created_at: "2026-04-01T22:30:00-04:00",
  },

  /* ── 2. Post-lesson cancel — coach confirmed lesson happened ─ */
  {
    id: "b8c9d0e1-0002-4f2a-3b4c-d8e9f0a10002",
    lesson_id: "e5f6a7b8-0010-4c9d-0e1f-a5b6c7d80010",   // Completed lesson — Aisha Diallo / Sandra Volkova (Mon)
    cancelled_by_last_name: "Diallo",
    cancelled_by_audit_number: "3304",
    cancelled_at: "2026-03-30T09:45:00-04:00",
    coach_response: true,                                   // coach confirmed the lesson happened
    coach_responded_at: "2026-03-30T12:15:00-04:00",
    auto_resolved: false,
    auto_resolve_at: "2026-04-02T09:45:00-04:00",
    created_at: "2026-03-30T09:45:00-04:00",
  },
];
