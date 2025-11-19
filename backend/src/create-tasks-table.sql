-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  points INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ NOT NULL,
  assigned_to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

