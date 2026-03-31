// coach_id values reference COACHES in coaches.ts
// approved_by references a director/creator profile (not in mock members)

export type CoachAvailabilityEntry = {
  id: string;
  coach_id: string;
  unavailable_from: string;
  unavailable_to: string;
  reason: string;
  approved_by: string | null;
  approved_at: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

// Director Kevin's profile id (referenced as approver)
const DIRECTOR_ID = "00000000-0000-4000-8000-000000000001";

export const COACH_AVAILABILITY: CoachAvailabilityEntry[] = [
  /* ── 1. Approved — Marco Reyes, vacation ───────────────────── */
  {
    id: "c9d0e1f2-0001-4a3b-4c5d-e0f1a2b30001",
    coach_id: "a1b2c3d4-0001-4e5f-8a9b-c1d2e3f40001",     // Marco Reyes
    unavailable_from: "2026-04-10T00:00:00-04:00",
    unavailable_to: "2026-04-17T23:59:59-04:00",
    reason: "Family vacation",
    approved_by: DIRECTOR_ID,
    approved_at: "2026-03-25T11:00:00-04:00",
    status: "approved",
    created_at: "2026-03-24T09:00:00-04:00",
  },

  /* ── 2. Approved — Priya Nair, medical ─────────────────────── */
  {
    id: "c9d0e1f2-0002-4a3b-4c5d-e0f1a2b30002",
    coach_id: "a1b2c3d4-0004-4e5f-8a9b-c1d2e3f40004",     // Priya Nair
    unavailable_from: "2026-04-07T00:00:00-04:00",
    unavailable_to: "2026-04-08T23:59:59-04:00",
    reason: "Medical appointment",
    approved_by: DIRECTOR_ID,
    approved_at: "2026-03-28T16:30:00-04:00",
    status: "approved",
    created_at: "2026-03-27T14:00:00-04:00",
  },

  /* ── 3. Pending — Elena Marchetti, personal ────────────────── */
  {
    id: "c9d0e1f2-0003-4a3b-4c5d-e0f1a2b30003",
    coach_id: "a1b2c3d4-0006-4e5f-8a9b-c1d2e3f40006",     // Elena Marchetti
    unavailable_from: "2026-04-14T00:00:00-04:00",
    unavailable_to: "2026-04-15T23:59:59-04:00",
    reason: "Personal day",
    approved_by: null,
    approved_at: null,
    status: "pending",
    created_at: "2026-03-30T10:00:00-04:00",
  },

  /* ── 4. Rejected — David Chen, tournament conflict ─────────── */
  {
    id: "c9d0e1f2-0004-4a3b-4c5d-e0f1a2b30004",
    coach_id: "a1b2c3d4-0005-4e5f-8a9b-c1d2e3f40005",     // David Chen
    unavailable_from: "2026-04-04T00:00:00-04:00",
    unavailable_to: "2026-04-06T23:59:59-04:00",
    reason: "Attending USTA regional tournament",
    approved_by: DIRECTOR_ID,
    approved_at: "2026-03-29T09:00:00-04:00",
    status: "rejected",
    created_at: "2026-03-28T08:00:00-04:00",
  },
];
