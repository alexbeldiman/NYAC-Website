delete from mitl_academy_sessions;
insert into mitl_academy_sessions (program, day_of_week, start_time, end_time) values
('mitl', 'monday', '10:00', '11:30'), ('mitl', 'tuesday', '10:00', '11:30'),
('mitl', 'wednesday', '10:00', '11:30'), ('mitl', 'thursday', '10:00', '11:30'),
('mitl', 'friday', '10:00', '11:30'), ('mitl', 'monday', '11:30', '12:30'),
('mitl', 'tuesday', '11:30', '12:30'), ('mitl', 'wednesday', '11:30', '12:30'),
('mitl', 'thursday', '11:30', '12:30'), ('mitl', 'friday', '11:30', '12:30'),
('mitl', 'monday', '13:30', '15:00'), ('mitl', 'tuesday', '13:30', '15:00'),
('mitl', 'wednesday', '13:30', '15:00'), ('mitl', 'thursday', '13:30', '15:00'),
('mitl', 'friday', '13:30', '15:00'),
('academy', 'monday', '11:30', '13:00'), ('academy', 'tuesday', '11:30', '13:00'),
('academy', 'wednesday', '11:30', '13:00'), ('academy', 'thursday', '11:30', '13:00'),
('academy', 'friday', '11:30', '13:00'), ('academy', 'monday', '13:30', '15:00'),
('academy', 'tuesday', '13:30', '15:00'), ('academy', 'wednesday', '13:30', '15:00'),
('academy', 'thursday', '13:30', '15:00'), ('academy', 'friday', '13:30', '15:00');
alter table mitl_academy_sessions alter column day_of_week set not null;
