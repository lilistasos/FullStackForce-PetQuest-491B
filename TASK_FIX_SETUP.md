# Task Sharing Fix - Setup Instructions

## Problem
Tasks were stored in AsyncStorage (local device storage), so when a parent created a task on their device, it wasn't visible to the child on their device.

## Solution
Tasks are now stored in the backend database and synced via API endpoints.

## Changes Made

### 1. Database Schema
- Created `backend/src/create-tasks-table.sql` with the tasks table schema
- Table includes: id, text, completed, category, description, points, due_date, assigned_to_user_id, assigned_by_user_id, created_at, updated_at

### 2. Backend API Endpoints
Added to `backend/src/index.js`:
- `POST /api/tasks` - Create a task (parent only)
- `GET /api/tasks` - Get tasks (returns different results for parent vs child)
- `PUT /api/tasks/:id` - Update task (toggle complete, edit fields)
- `DELETE /api/tasks/:id` - Delete task (parent only)
- `GET /api/users/children` - Get list of children for a parent

### 3. Frontend Updates
- **TaskContext** (`frontend/contexts/TaskContext.tsx`):
  - Now uses backend API instead of AsyncStorage
  - Fetches tasks on mount and when user/token changes
  - All operations (add, toggle, get) now sync with backend
  
- **Parent Task Creation** (`frontend/app/(parent)/(tabs)/post/parentcreatetaskscreen.tsx`):
  - Updated to handle async `addTask` function
  - Shows error alerts if task creation fails
  
- **Child Selection** (`frontend/app/(parent)/(tabs)/post/index.tsx`):
  - Now fetches children from backend API instead of hardcoded list
  - Shows loading state and empty state
  
- **Child Todo Screen** (`frontend/app/(child)/(tabs)/todo/index.tsx`):
  - Updated to handle async `toggleComplete` function

## Setup Instructions

### 1. Create the Database Table
Run the SQL script to create the tasks table:

```bash
cd backend
node src/setup-tasks-table.js
```

Or manually run the SQL:
```bash
psql -d your_database_name -f src/create-tasks-table.sql
```

### 2. Restart Backend Server
Make sure your backend server is running:
```bash
cd backend
npm start
```

### 3. Test the Fix
1. Log in as a parent account
2. Create a task for a child
3. Log out and log in as the child account
4. The task should now appear in the child's todo list

## How It Works

1. **Parent creates task**: Task is saved to database with `assigned_to_user_id` and `assigned_by_user_id`
2. **Child logs in**: TaskContext automatically fetches tasks assigned to that child from the backend
3. **Child completes task**: Task completion is synced to the backend
4. **Parent views tasks**: Parent can see all tasks they've created for their children

## Notes
- Tasks are now shared across devices via the backend database
- The system uses user IDs to link tasks to users, ensuring proper family relationships
- All task operations require authentication
- Tasks are automatically filtered based on user role (parent sees tasks they created, child sees tasks assigned to them)

