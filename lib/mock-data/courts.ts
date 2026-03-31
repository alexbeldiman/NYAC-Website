export type Court = {
  id: string;
  name: string;
  is_pro_court: boolean;
  status: "available" | "blocked" | "maintenance";
  blocked_reason: string | null;
  created_at: string;
};

export const COURTS: Court[] = [
  { id: "d4e5f6a7-0001-4b8c-9d0e-f4a5b6c70001", name: "Court 1",  is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0002-4b8c-9d0e-f4a5b6c70002", name: "Court 2",  is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0003-4b8c-9d0e-f4a5b6c70003", name: "Court 3",  is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0004-4b8c-9d0e-f4a5b6c70004", name: "Court 4",  is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0005-4b8c-9d0e-f4a5b6c70005", name: "Court 5",  is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0006-4b8c-9d0e-f4a5b6c70006", name: "Court 6",  is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0007-4b8c-9d0e-f4a5b6c70007", name: "Court 7",  is_pro_court: false, status: "blocked",      blocked_reason: "Reserved for junior tournament setup",   created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0008-4b8c-9d0e-f4a5b6c70008", name: "Court 8",  is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0009-4b8c-9d0e-f4a5b6c70009", name: "Court 9",  is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0010-4b8c-9d0e-f4a5b6c70010", name: "Court 10", is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0011-4b8c-9d0e-f4a5b6c70011", name: "Court 11", is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0012-4b8c-9d0e-f4a5b6c70012", name: "Court 12", is_pro_court: false, status: "maintenance",  blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0013-4b8c-9d0e-f4a5b6c70013", name: "Court 13", is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0014-4b8c-9d0e-f4a5b6c70014", name: "Court 14", is_pro_court: false, status: "blocked",      blocked_reason: "Net replacement in progress",            created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0015-4b8c-9d0e-f4a5b6c70015", name: "Court 15", is_pro_court: false, status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0016-4b8c-9d0e-f4a5b6c70016", name: "Court 16", is_pro_court: true,  status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0017-4b8c-9d0e-f4a5b6c70017", name: "Court 17", is_pro_court: true,  status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
  { id: "d4e5f6a7-0018-4b8c-9d0e-f4a5b6c70018", name: "Court 18", is_pro_court: true,  status: "available",    blocked_reason: null,                                    created_at: "2026-01-15T10:00:00-05:00" },
];
