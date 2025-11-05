CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  profile_image TEXT,
  username TEXT,
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

ALTER TABLE users ADD COLUMN profile_image TEXT;
