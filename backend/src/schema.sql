-- ===========================
-- PetQuest Database Schema
-- ===========================
-- Run this file to create all database tables
-- Usage: psql $DATABASE_URL -f src/schema.sql
-- Or use the setup-database.js script: node setup-database.js

-- ===========================
-- Users Table
-- ===========================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role VARCHAR(10) 
    CHECK (role IN ('parent','child','individual')) NOT NULL,
  family_code CHAR(6),
  date_of_birth DATE NOT NULL,
  reset_token TEXT,
  reset_expires TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  points INTEGER NOT NULL DEFAULT 0,
  username TEXT,
  profile_image TEXT,
  last_login_date DATE
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='points') THEN
    ALTER TABLE users ADD COLUMN points INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='username') THEN
    ALTER TABLE users ADD COLUMN username TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='profile_image') THEN
    ALTER TABLE users ADD COLUMN profile_image TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='last_login_date') THEN
    ALTER TABLE users ADD COLUMN last_login_date DATE;
  END IF;
END $$;

-- ===========================
-- Pets Table
-- ===========================
CREATE TABLE IF NOT EXISTS pets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT FALSE,
  cost INTEGER NOT NULL DEFAULT 0
);

-- ===========================
-- Pet Accessories Table
-- ===========================
CREATE TABLE IF NOT EXISTS pet_accessories (
  id SERIAL PRIMARY KEY,
  pet_id INTEGER NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible BOOLEAN NOT NULL DEFAULT FALSE,
  cost INTEGER NOT NULL DEFAULT 0
);

-- ===========================
-- Tasks Table
-- ===========================
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  category VARCHAR(50),
  description TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ,
  assigned_to_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  type VARCHAR(10) DEFAULT 'task' CHECK (type IN ('task', 'event'))
);

-- Add type column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='type') THEN
    ALTER TABLE tasks ADD COLUMN type VARCHAR(10) DEFAULT 'task' CHECK (type IN ('task', 'event'));
    -- Set existing tasks to 'task' type
    UPDATE tasks SET type = 'task' WHERE type IS NULL;
  END IF;
END $$;

-- ===========================
-- Indexes for Performance
-- ===========================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_family_code ON users(family_code);
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_accessories_pet_id ON pet_accessories(pet_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_user_id ON tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by_user_id ON tasks(assigned_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

