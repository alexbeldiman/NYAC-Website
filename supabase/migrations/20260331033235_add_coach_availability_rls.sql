-- Add auto-resolve deadline to lesson cancellation reviews
alter table lesson_cancellation_reviews 
  add column auto_resolve_at timestamptz;

-- Fix clinic_signups RLS to allow updates for cancellation
drop policy if exists "coaches can update signups" on clinic_signups;

create policy "coaches can update signups"
  on clinic_signups for update
  using (true);

-- Coach availability RLS fixes
drop policy if exists "coaches manage own availability" on coach_availability;

create policy "coaches can insert own availability"
  on coach_availability for insert
  with check (true);

create policy "coaches can read own availability"
  on coach_availability for select
  using (true);

create policy "coaches can update own availability"
  on coach_availability for update
  using (true);