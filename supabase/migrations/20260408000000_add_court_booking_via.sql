-- Allow 'court_booking' as a booked_via value to distinguish
-- court-only reservations from private lessons in the member app.
alter table private_lessons
  drop constraint if exists private_lessons_booked_via_check;

alter table private_lessons
  add constraint private_lessons_booked_via_check
  check (booked_via in ('member_app','tennis_house','coach','court_booking'));
