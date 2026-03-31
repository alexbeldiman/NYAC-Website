drop policy if exists "anyone authenticated can book lessons" on private_lessons;
drop policy if exists "anyone can insert lessons" on private_lessons;

create policy "anyone can insert lessons"
  on private_lessons for insert
  with check (true);

create policy "anyone can insert pickup requests"
  on pickup_requests for insert
  with check (true);