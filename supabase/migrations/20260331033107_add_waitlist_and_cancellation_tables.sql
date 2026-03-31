-- Add late cancel fields to clinic_signups
alter table clinic_signups add column cancelled_at timestamptz;
alter table clinic_signups add column late_cancel boolean not null default false;
alter table clinic_signups add column is_cancelled boolean not null default false;

-- Clinic waitlist
create table clinic_waitlist (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references clinic_slots(id) on delete cascade,
  last_name text not null,
  audit_number text not null,
  guest_count integer not null default 0,
  guest_names text[] not null default '{}',
  waitlist_position integer not null,
  joined_at timestamptz not null default now(),
  notified_at timestamptz,
  unique(slot_id, audit_number)
);

-- Lesson cancellation reviews
create table lesson_cancellation_reviews (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references private_lessons(id) on delete cascade,
  cancelled_by_last_name text not null,
  cancelled_by_audit_number text not null,
  cancelled_at timestamptz not null default now(),
  coach_response boolean,
  coach_responded_at timestamptz,
  auto_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table clinic_waitlist enable row level security;
alter table lesson_cancellation_reviews enable row level security;

-- RLS policies
create policy "anyone can join waitlist"
  on clinic_waitlist for insert
  with check (true);

create policy "anyone can read waitlist"
  on clinic_waitlist for select
  using (true);

create policy "anyone can delete from waitlist"
  on clinic_waitlist for delete
  using (true);

create policy "anyone can insert cancellation review"
  on lesson_cancellation_reviews for insert
  with check (true);

create policy "staff can read cancellation reviews"
  on lesson_cancellation_reviews for select
  using (get_my_role() in ('coach','director','creator'));

create policy "staff can update cancellation reviews"
  on lesson_cancellation_reviews for update
  using (get_my_role() in ('coach','director','creator'));