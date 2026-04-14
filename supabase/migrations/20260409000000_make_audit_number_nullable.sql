-- Staff accounts (coach, director, tennis_house) don't have club audit numbers.
-- Only member profiles need audit_number for identity verification.
ALTER TABLE profiles ALTER COLUMN audit_number DROP NOT NULL;
