-- Run in Supabase SQL Editor to add workspace columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_path text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_repo_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_requested boolean DEFAULT false;
