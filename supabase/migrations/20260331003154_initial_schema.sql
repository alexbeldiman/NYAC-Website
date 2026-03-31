create extension if not exists "uuid-ossp" schema extensions;

create table profiles (
  id uuid primary key default gen_random_uuid(),
  audit_number text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  role text check (role in ('creator','director','coach','tennis_house')),
  is_child boolean not null default false,
  date_of_birth date,
  gender text check (gender in ('male','female','other')),
  parent_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_pro_court boolean not null default false,
  status text not null default 'available' check (status in ('available','blocked','maintenance')),
  blocked_reason text,
  created_at timestamptz not null default now()
);

create table clinic_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  hour integer not null check (hour in (9,10,11)),
  gender_restriction text not null check (gender_restriction in ('women_only','mixed')),
  capacity integer not null default 36,
  access_code text,
  code_generated_at timestamptz,
  created_at timestamptz not null default now(),
  unique(date, hour)
);

create table clinic_signups (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references clinic_slots(id) on delete cascade,
  member_id uuid not null references profiles(id) on delete cascade,
  guest_count integer not null default 0,
  guest_names text[] not null default '{}',
  added_by uuid not null references profiles(id),
  checked_in boolean not null default false,
  signed_up_at timestamptz not null default now(),
  unique(slot_id, member_id)
);

create table coach_availability (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles(id) on delete cascade,
  unavailable_from timestamptz not null,
  unavailable_to timestamptz not null,
  reason text,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table recurrences (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles(id) on delete cascade,
  coach_id uuid not null references profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  duration_minutes integer not null check (duration_minutes % 30 = 0),
  created_by uuid not null references profiles(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table private_lessons (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles(id) on delete cascade,
  booked_by_id uuid not null references profiles(id),
  coach_id uuid references profiles(id),
  start_time timestamptz not null,
  duration_minutes integer not null check (duration_minutes % 30 = 0),
  status text not null default 'confirmed' check (status in ('pending_pickup','confirmed','cancelled','completed')),
  is_recurring boolean not null default false,
  recurrence_id uuid references recurrences(id) on delete set null,
  court_id uuid references courts(id) on delete set null,
  booked_via text not null check (booked_via in ('member_app','tennis_house','coach')),
  confirmation_sent_at timestamptz,
  confirmed_by_member boolean,
  created_at timestamptz not null default now()
);

create table pickup_requests (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references private_lessons(id) on delete cascade,
  notified_coaches_at timestamptz,
  claimed_by uuid references profiles(id),
  claimed_at timestamptz,
  escalated_to_director boolean not null default false,
  escalated_at timestamptz,
  created_at timestamptz not null default now()
);

create table mitl_academy_sessions (
  id uuid primary key default gen_random_uuid(),
  program text not null check (program in ('mitl','academy')),
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  unique(program, day_of_week, start_time)
);

create table mitl_academy_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references mitl_academy_sessions(id) on delete cascade,
  child_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  checked_in_by uuid not null references profiles(id),
  age_exception boolean not null default false,
  checked_in_at timestamptz not null default now(),
  unique(session_id, child_id, date)
);