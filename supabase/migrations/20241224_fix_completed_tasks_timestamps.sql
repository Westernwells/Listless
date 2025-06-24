-- Migration to fix completed tasks that don't have completed_at timestamps
-- This addresses the issue where tasks marked as completed before the fix
-- don't have the completed_at field set, causing them not to appear in the Completed view

-- Update all completed tasks that don't have a completed_at timestamp
-- Set completed_at to the updated_at timestamp as a reasonable approximation
UPDATE tasks 
SET completed_at = updated_at 
WHERE completed = true 
  AND completed_at IS NULL;

-- Add a comment to document this migration
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task was marked as completed. Fixed in migration 20241224_fix_completed_tasks_timestamps.sql';
