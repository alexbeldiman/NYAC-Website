alter table mitl_academy_sessions drop column day_of_week;
alter table mitl_academy_sessions add column day_of_week text check (day_of_week in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday'));
