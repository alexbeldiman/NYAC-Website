-- Create dedicated court_bookings table, separate from private_lessons
create table court_bookings (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles(id) on delete cascade,
  booked_by_id uuid not null references profiles(id),
  court_id uuid not null references courts(id) on delete cascade,
  start_time timestamptz not null,
  duration_minutes integer not null check (duration_minutes % 30 = 0),
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz not null default now()
);

alter table court_bookings enable row level security;

create policy "anyone can insert court bookings"
  on court_bookings for insert
  with check (true);

create policy "staff can read court bookings"
  on court_bookings for select
  using (get_my_role() in ('coach','director','creator','tennis_house'));

create policy "staff can update court bookings"
  on court_bookings for update
  using (get_my_role() in ('director','creator','tennis_house'));

-- Migrate existing court booking rows out of private_lessons
insert into court_bookings (id, member_id, booked_by_id, court_id, start_time, duration_minutes, status, created_at)
select id, member_id, booked_by_id, court_id, start_time, duration_minutes, status, created_at
from private_lessons
where booked_via = 'court_booking'
  and court_id is not null;

delete from private_lessons where booked_via = 'court_booking';

-- Remove 'court_booking' from the private_lessons booked_via constraint
alter table private_lessons
  drop constraint private_lessons_booked_via_check;

alter table private_lessons
  add constraint private_lessons_booked_via_check
  check (booked_via in ('member_app','tennis_house','coach'));
