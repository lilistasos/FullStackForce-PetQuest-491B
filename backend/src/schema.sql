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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  points INTEGER NOT NULL DEFAULT 0
);

-- ===========================
-- Pets Table
-- ===========================
CREATE TABLE IF NOT EXISTS pets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  point_value INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category VARCHAR(20)
    CHECK (category IN ('Homework', 'Chores', 'Extracurriculars', 'Practice', 'Appointments', 'Other'))
);

-- ===========================
-- Indexes for Performance
-- ===========================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_family_code ON users(family_code);
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_accessories_pet_id ON pet_accessories(pet_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

