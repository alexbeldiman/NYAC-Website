-- Tighten coach_availability, clinic_signups update, and clinic_waitlist delete RLS policies

-- 1) coach_availability
drop policy if exists "coaches manage own availability" on coach_availability;
drop policy if exists "coaches can insert own availability" on coach_availability;
drop policy if exists "coaches can read own availability" on coach_availability;
drop policy if exists "coaches can update own availability" on coach_availability;

create policy "coaches can read own + directors can read all availability"
  on coach_availability for select
  using (coach_id = auth.uid() or get_my_role() in ('director','creator'));

create policy "authenticated can insert availability"
  on coach_availability for insert
  with check (auth.uid() is not null);

create policy "coaches can update own + directors can update all availability"
  on coach_availability for update
  using (coach_id = auth.uid() or get_my_role() in ('director','creator'))
  with check (coach_id = auth.uid() or get_my_role() in ('director','creator'));

-- 2) clinic_signups update policy
drop policy if exists "coaches can update signups" on clinic_signups;

create policy "coaches can update signups"
  on clinic_signups for update
  using (auth.uid() is not null and get_my_role() in ('coach','director','creator'))
  with check (auth.uid() is not null and get_my_role() in ('coach','director','creator'));

-- 3) clinic_waitlist delete policy
drop policy if exists "anyone can delete from waitlist" on clinic_waitlist;

create policy "member can delete own waitlist or staff can delete any"
  on clinic_waitlist for delete
  using (
    audit_number in (select p.audit_number from profiles p where p.id = auth.uid())
    or get_my_role() in ('coach','director','creator','tennis_house')
  );
