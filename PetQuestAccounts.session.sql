CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role VARCHAR(10) CHECK (role IN ('parent','child','individual')) NOT NULL,
  family_code CHAR(6),
  date_of_birth DATE NOT NULL,
  reset_token TEXT,
  reset_expires TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP;