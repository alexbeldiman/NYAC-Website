export type Coach = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "coach";
  is_child: false;
  audit_number: string;
};

export const COACHES: Coach[] = [
  {
    id: "a1b2c3d4-0001-4e5f-8a9b-c1d2e3f40001",
    first_name: "Marco",
    last_name: "Reyes",
    phone: "212-555-0101",
    role: "coach",
    is_child: false,
    audit_number: "STAFF001",
  },
  {
    id: "a1b2c3d4-0002-4e5f-8a9b-c1d2e3f40002",
    first_name: "Sandra",
    last_name: "Volkova",
    phone: "212-555-0102",
    role: "coach",
    is_child: false,
    audit_number: "STAFF002",
  },
  {
    id: "a1b2c3d4-0003-4e5f-8a9b-c1d2e3f40003",
    first_name: "James",
    last_name: "Okafor",
    phone: "212-555-0103",
    role: "coach",
    is_child: false,
    audit_number: "STAFF003",
  },
  {
    id: "a1b2c3d4-0004-4e5f-8a9b-c1d2e3f40004",
    first_name: "Priya",
    last_name: "Nair",
    phone: "212-555-0104",
    role: "coach",
    is_child: false,
    audit_number: "STAFF004",
  },
  {
    id: "a1b2c3d4-0005-4e5f-8a9b-c1d2e3f40005",
    first_name: "David",
    last_name: "Chen",
    phone: "212-555-0105",
    role: "coach",
    is_child: false,
    audit_number: "STAFF005",
  },
  {
    id: "a1b2c3d4-0006-4e5f-8a9b-c1d2e3f40006",
    first_name: "Elena",
    last_name: "Marchetti",
    phone: "212-555-0106",
    role: "coach",
    is_child: false,
    audit_number: "STAFF006",
  },
];
