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

CREATE TABLE IF NOT EXISTS pets (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  image_url   TEXT,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS pet_accessories (
  id          SERIAL PRIMARY KEY,
  pet_id      INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  image_url   TEXT,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tasks (
  id           SERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);
