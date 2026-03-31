export type Member = {
  id: string;
  audit_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_child: boolean;
  parent_id: string | null;
  gender: "male" | "female";
  date_of_birth: string;
};

export const MEMBERS: Member[] = [
  /* ── Individual adults ─────────────────────────────────────── */

  {
    id: "b2c3d4e5-0001-4f6a-9b0c-d2e3f4a50001",
    audit_number: "1042",
    first_name: "Catherine",
    last_name: "Harlow",
    phone: "212-555-1001",
    is_child: false,
    parent_id: null,
    gender: "female",
    date_of_birth: "1985-06-14",
  },
  {
    id: "b2c3d4e5-0002-4f6a-9b0c-d2e3f4a50002",
    audit_number: "2187",
    first_name: "Robert",
    last_name: "Fenwick",
    phone: "212-555-1002",
    is_child: false,
    parent_id: null,
    gender: "male",
    date_of_birth: "1979-11-03",
  },
  {
    id: "b2c3d4e5-0003-4f6a-9b0c-d2e3f4a50003",
    audit_number: "3304",
    first_name: "Aisha",
    last_name: "Diallo",
    phone: "212-555-1003",
    is_child: false,
    parent_id: null,
    gender: "female",
    date_of_birth: "1992-03-28",
  },

  /* ── Family 1: Thornton — parent + 2 children ─────────────── */

  {
    id: "b2c3d4e5-0004-4f6a-9b0c-d2e3f4a50004",
    audit_number: "4471",
    first_name: "Michael",
    last_name: "Thornton",
    phone: "212-555-1004",
    is_child: false,
    parent_id: null,
    gender: "male",
    date_of_birth: "1975-08-19",
  },
  {
    id: "b2c3d4e5-0005-4f6a-9b0c-d2e3f4a50005",
    audit_number: "4471",
    first_name: "Sophie",
    last_name: "Thornton",
    phone: "212-555-1004",
    is_child: true,
    parent_id: "b2c3d4e5-0004-4f6a-9b0c-d2e3f4a50004",
    gender: "female",
    date_of_birth: "2012-04-07", // age 13
  },
  {
    id: "b2c3d4e5-0006-4f6a-9b0c-d2e3f4a50006",
    audit_number: "4471",
    first_name: "Liam",
    last_name: "Thornton",
    phone: "212-555-1004",
    is_child: true,
    parent_id: "b2c3d4e5-0004-4f6a-9b0c-d2e3f4a50004",
    gender: "male",
    date_of_birth: "2015-01-22", // age 11
  },

  /* ── Family 2: Park — parent + 1 child ────────────────────── */

  {
    id: "b2c3d4e5-0008-4f6a-9b0c-d2e3f4a50008",
    audit_number: "6612",
    first_name: "Jin",
    last_name: "Park",
    phone: "212-555-1008",
    is_child: false,
    parent_id: null,
    gender: "male",
    date_of_birth: "1982-12-05",
  },
  {
    id: "b2c3d4e5-0009-4f6a-9b0c-d2e3f4a50009",
    audit_number: "6612",
    first_name: "Mia",
    last_name: "Park",
    phone: "212-555-1008",
    is_child: true,
    parent_id: "b2c3d4e5-0008-4f6a-9b0c-d2e3f4a50008",
    gender: "female",
    date_of_birth: "2013-07-18", // age 12
  },

  /* ── Family 3: Castillo — parent + 2 children ─────────────── */

  {
    id: "b2c3d4e5-0013-4f6a-9b0c-d2e3f4a50013",
    audit_number: "5593",
    first_name: "Rafael",
    last_name: "Castillo",
    phone: "212-555-1013",
    is_child: false,
    parent_id: null,
    gender: "male",
    date_of_birth: "1980-03-12",
  },
  {
    id: "b2c3d4e5-0014-4f6a-9b0c-d2e3f4a50014",
    audit_number: "5593",
    first_name: "Diego",
    last_name: "Castillo",
    phone: "212-555-1013",
    is_child: true,
    parent_id: "b2c3d4e5-0013-4f6a-9b0c-d2e3f4a50013",
    gender: "male",
    date_of_birth: "2010-09-04", // age 15
  },
  {
    id: "b2c3d4e5-0015-4f6a-9b0c-d2e3f4a50015",
    audit_number: "5593",
    first_name: "Isabella",
    last_name: "Castillo",
    phone: "212-555-1013",
    is_child: true,
    parent_id: "b2c3d4e5-0013-4f6a-9b0c-d2e3f4a50013",
    gender: "female",
    date_of_birth: "2017-02-15", // age 9 — MITL age exception test
  },

  /* ── Family 4: Brennan — parent + 1 child ─────────────────── */

  {
    id: "b2c3d4e5-0016-4f6a-9b0c-d2e3f4a50016",
    audit_number: "7745",
    first_name: "Gregory",
    last_name: "Brennan",
    phone: "212-555-1016",
    is_child: false,
    parent_id: null,
    gender: "male",
    date_of_birth: "1969-02-11",
  },
  {
    id: "b2c3d4e5-0017-4f6a-9b0c-d2e3f4a50017",
    audit_number: "7745",
    first_name: "Nora",
    last_name: "Brennan",
    phone: "212-555-1016",
    is_child: true,
    parent_id: "b2c3d4e5-0016-4f6a-9b0c-d2e3f4a50016",
    gender: "female",
    date_of_birth: "2014-11-30", // age 11
  },
  {
    id: "b2c3d4e5-0018-4f6a-9b0c-d2e3f4a50018",
    audit_number: "6612",
    first_name: "Leo",
    last_name: "Park",
    phone: "212-555-1008",
    is_child: true,
    parent_id: "b2c3d4e5-0008-4f6a-9b0c-d2e3f4a50008",
    gender: "male",
    date_of_birth: "2017-05-12", // age 8
  },
  {
    id: "b2c3d4e5-0019-4f6a-9b0c-d2e3f4a50019",
    audit_number: "7745",
    first_name: "Ava",
    last_name: "Brennan",
    phone: "212-555-1016",
    is_child: true,
    parent_id: "b2c3d4e5-0016-4f6a-9b0c-d2e3f4a50016",
    gender: "female",
    date_of_birth: "2011-03-24", // age 14
  },
];
