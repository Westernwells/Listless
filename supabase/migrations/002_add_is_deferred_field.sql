-- Add is_deferred field to tasks table for Deferred view functionality
-- This migration adds the missing field needed for proper task view filtering

-- Add the is_deferred column to the tasks table
ALTER TABLE public.tasks 
ADD COLUMN is_deferred boolean DEFAULT false NOT NULL;

-- Add index for efficient querying of deferred tasks
CREATE INDEX idx_tasks_deferred ON public.tasks(user_id, is_deferred) WHERE is_deferred = true;

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.is_deferred IS 'Indicates if a task has been explicitly deferred by the user';
