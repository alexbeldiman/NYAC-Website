// slot_id references the Saturday 10am slot (FULL) from clinic-slots.ts
// audit_number values reference MEMBERS in members.ts

export type ClinicWaitlistEntry = {
  id: string;
  slot_id: string;
  last_name: string;
  audit_number: string;
  guest_count: number;
  guest_names: string[];
  waitlist_position: number;
  joined_at: string;
  notified_at: string | null;
};

export const CLINIC_WAITLIST: ClinicWaitlistEntry[] = [
  {
    id: "a7b8c9d0-0001-4e1f-2a3b-c7d8e9f00001",
    slot_id: "c3d4e5f6-0003-4a7b-8c9d-e3f4a5b60003",    // Sat 10am (full)
    last_name: "Harlow",
    audit_number: "1042",                                  // Catherine Harlow
    guest_count: 0,
    guest_names: [],
    waitlist_position: 1,
    joined_at: "2026-04-04T07:45:00-04:00",
    notified_at: null,
  },
  {
    id: "a7b8c9d0-0002-4e1f-2a3b-c7d8e9f00002",
    slot_id: "c3d4e5f6-0003-4a7b-8c9d-e3f4a5b60003",    // Sat 10am (full)
    last_name: "Brennan",
    audit_number: "7745",                                  // Gregory Brennan
    guest_count: 1,
    guest_names: ["Patrick Brennan"],
    waitlist_position: 2,
    joined_at: "2026-04-04T08:02:00-04:00",
    notified_at: null,
  },
  {
    id: "a7b8c9d0-0003-4e1f-2a3b-c7d8e9f00003",
    slot_id: "c3d4e5f6-0003-4a7b-8c9d-e3f4a5b60003",    // Sat 10am (full)
    last_name: "Diallo",
    audit_number: "3304",                                  // Aisha Diallo
    guest_count: 0,
    guest_names: [],
    waitlist_position: 3,
    joined_at: "2026-04-04T08:15:00-04:00",
    notified_at: null,
  },
];
