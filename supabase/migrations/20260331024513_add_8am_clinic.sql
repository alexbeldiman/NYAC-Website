alter table clinic_slots drop constraint clinic_slots_hour_check;
alter table clinic_slots add constraint clinic_slots_hour_check check (hour in (8, 9, 10, 11));
alter table clinic_slots drop constraint clinic_slots_gender_restriction_check;
alter table clinic_slots add constraint clinic_slots_gender_restriction_check check (gender_restriction in ('women_only', 'mixed', 'men_only'));