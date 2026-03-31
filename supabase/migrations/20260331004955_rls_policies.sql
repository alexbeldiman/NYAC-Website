alter table profiles enable row level security;
alter table courts enable row level security;
alter table clinic_slots enable row level security;
alter table clinic_signups enable row level security;
alter table coach_availability enable row level security;
alter table recurrences enable row level security;
alter table private_lessons enable row level security;
alter table pickup_requests enable row level security;
alter table mitl_academy_sessions enable row level security;
alter table mitl_academy_attendance enable row level security;

create or replace function get_my_role()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

create policy "staff can read all profiles"
  on profiles for select
  using (get_my_role() in ('creator','director','coach','tennis_house'));

create policy "staff can insert profiles"
  on profiles for insert
  with check (get_my_role() in ('creator','director','coach'));

create policy "staff can update profiles"
  on profiles for update
  using (get_my_role() in ('creator','director'));

create policy "public can verify member"
  on profiles for select
  using (true);

create policy "anyone can read courts"
  on courts for select
  using (true);

create policy "tennis house can update courts"
  on courts for update
  using (get_my_role() in ('tennis_house','director','creator'));

create policy "anyone can read clinic slots"
  on clinic_slots for select
  using (true);

create policy "director can manage clinic slots"
  on clinic_slots for all
  using (get_my_role() in ('director','creator'));

create policy "anyone can read clinic signups count"
  on clinic_signups for select
  using (true);

create policy "anyone can insert clinic signups"
  on clinic_signups for insert
  with check (true);

create policy "coaches can update signups"
  on clinic_signups for update
  using (get_my_role() in ('coach','director','creator'));

create policy "coaches can delete signups"
  on clinic_signups for delete
  using (get_my_role() in ('coach','director','creator'));

create policy "coaches manage own availability"
  on coach_availability for all
  using (coach_id = auth.uid() or get_my_role() in ('director','creator'));

create policy "staff can read lessons"
  on private_lessons for select
  using (get_my_role() in ('coach','director','creator','tennis_house'));

create policy "anyone can insert lessons"
  on private_lessons for insert
  with check (true);

create policy "staff can update lessons"
  on private_lessons for update
  using (get_my_role() in ('coach','director','creator','tennis_house'));

create policy "coaches can see pickup requests"
  on pickup_requests for select
  using (get_my_role() in ('coach','director','creator','tennis_house'));

create policy "coaches can claim pickup requests"
  on pickup_requests for update
  using (get_my_role() in ('coach','director','creator'));

create policy "anyone can read program sessions"
  on mitl_academy_sessions for select
  using (true);

create policy "coaches can manage attendance"
  on mitl_academy_attendance for all
  using (get_my_role() in ('coach','director','creator'));

create policy "staff can read recurrences"
  on recurrences for all
  using (get_my_role() in ('coach','director','creator'));