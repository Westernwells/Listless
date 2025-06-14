-- Seed data for initial setup
-- This file contains default data that should be present in the database

-- Insert default system tags that are useful for most users
-- These will be created for each user when they sign up

-- Note: This seed data will be applied to the database, but user-specific
-- data should be created through the application logic when users sign up

-- Create a function to set up default data for a new user
create or replace function public.setup_new_user_defaults(user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  work_area_id uuid;
  personal_area_id uuid;
  inbox_project_id uuid;
  work_project_id uuid;
  personal_project_id uuid;
begin
  -- Create default areas
  insert into public.areas (id, user_id, name, description, color, sort_order)
  values 
    (gen_random_uuid(), user_id, 'Work', 'Work-related projects and tasks', '#3b82f6', 1),
    (gen_random_uuid(), user_id, 'Personal', 'Personal projects and tasks', '#10b981', 2)
  returning id into work_area_id, personal_area_id;
  
  -- Get the area IDs for project creation
  select id into work_area_id from public.areas where user_id = setup_new_user_defaults.user_id and name = 'Work';
  select id into personal_area_id from public.areas where user_id = setup_new_user_defaults.user_id and name = 'Personal';
  
  -- Create default project lists
  insert into public.project_lists (id, user_id, area_id, name, description, color, sort_order)
  values 
    (gen_random_uuid(), user_id, null, 'Inbox', 'Capture all incoming tasks here', '#6b7280', 0),
    (gen_random_uuid(), user_id, work_area_id, 'Current Projects', 'Active work projects', '#3b82f6', 1),
    (gen_random_uuid(), user_id, personal_area_id, 'Personal Tasks', 'Personal to-dos and projects', '#10b981', 1);
  
  -- Create default tags
  insert into public.tags (user_id, name, color, is_system)
  values 
    (user_id, 'urgent', '#ef4444', true),
    (user_id, 'important', '#f59e0b', true),
    (user_id, 'waiting', '#6b7280', true),
    (user_id, 'someday', '#8b5cf6', true),
    (user_id, 'quick', '#06b6d4', true),
    (user_id, 'meeting', '#ec4899', true),
    (user_id, 'email', '#84cc16', true),
    (user_id, 'call', '#f97316', true),
    (user_id, 'research', '#14b8a6', true),
    (user_id, 'review', '#a855f7', true);
  
  -- Get inbox project ID for welcome tasks
  select id into inbox_project_id 
  from public.project_lists 
  where user_id = setup_new_user_defaults.user_id and name = 'Inbox';
  
  -- Create welcome tasks
  insert into public.tasks (user_id, project_list_id, title, description, priority, sort_order)
  values 
    (
      user_id, 
      inbox_project_id, 
      'Welcome to your task manager! 🎉', 
      'This is your first task. You can edit, complete, or delete it. Try exploring the features like adding tags, setting due dates, and organizing tasks into projects.',
      'medium',
      1
    ),
    (
      user_id, 
      inbox_project_id, 
      'Explore the AI features', 
      'This app includes AI-powered auto-tagging and smart grouping. As you add more tasks, the AI will learn to suggest relevant tags automatically.',
      'low',
      2
    ),
    (
      user_id, 
      inbox_project_id, 
      'Organize your workspace', 
      'Create areas and projects that match your workflow. You can drag and drop tasks between projects and use the sidebar to navigate quickly.',
      'medium',
      3
    );
end;
$$;

-- Create a trigger to automatically set up defaults for new users
create or replace function private.setup_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Set up default data for the new user
  perform public.setup_new_user_defaults(new.id);
  return new;
end;
$$;

-- Create the trigger
create trigger setup_new_user_defaults_trigger
  after insert on public.users
  for each row execute function private.setup_new_user();

-- Insert some example data for development/testing (optional)
-- This section can be commented out for production

/*
-- Example user (for development only)
insert into auth.users (id, email, email_confirmed_at, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'demo@example.com',
  now(),
  now(),
  now()
) on conflict (id) do nothing;

-- This will trigger the automatic setup
insert into public.users (id, name, bio)
values (
  '00000000-0000-0000-0000-000000000001',
  'Demo User',
  'This is a demo user for testing purposes'
) on conflict (id) do nothing;
*/

-- Create indexes for better performance on commonly queried columns
-- (Additional indexes beyond those in the main schema)

-- Composite indexes for common query patterns
create index if not exists idx_tasks_user_project_completed 
on public.tasks(user_id, project_list_id, completed) 
where is_deleted = false;

create index if not exists idx_tasks_user_due_date_completed 
on public.tasks(user_id, due_date, completed) 
where is_deleted = false and due_date is not null;

create index if not exists idx_task_tags_user_ai_suggested 
on public.task_tags(tag_id) 
where is_ai_suggested = true;

-- Partial indexes for better performance
create index if not exists idx_tasks_active 
on public.tasks(user_id, updated_at desc) 
where is_deleted = false;

create index if not exists idx_tasks_overdue 
on public.tasks(user_id, due_date) 
where completed = false and is_deleted = false and due_date < now();

-- Function to get database statistics (useful for monitoring)
create or replace function public.get_database_stats()
returns table (
  table_name text,
  row_count bigint,
  size_pretty text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty
  from pg_stat_user_tables 
  where schemaname = 'public'
  order by pg_total_relation_size(schemaname||'.'||tablename) desc;
end;
$$;

-- Grant necessary permissions
-- These grants ensure that authenticated users can access the functions

grant execute on function public.match_tasks(vector, float, int, uuid) to authenticated;
grant execute on function public.suggest_tags_for_task(uuid, float, int) to authenticated;
grant execute on function public.update_task_embedding(uuid, vector) to authenticated;
grant execute on function public.batch_update_embeddings(jsonb) to authenticated;
grant execute on function public.record_action(text, text, uuid, jsonb, jsonb, uuid, boolean) to authenticated;
grant execute on function public.get_action_history(int, int, text, uuid) to authenticated;
grant execute on function public.cleanup_old_action_history(int) to authenticated;
grant execute on function public.get_task_statistics() to authenticated;
grant execute on function public.setup_new_user_defaults(uuid) to authenticated;
grant execute on function public.get_database_stats() to authenticated;

-- Create a view for task analytics (useful for dashboards)
create or replace view public.task_analytics as
select 
  t.user_id,
  count(*) as total_tasks,
  count(*) filter (where t.completed = true) as completed_tasks,
  count(*) filter (where t.completed = false and t.is_deleted = false) as active_tasks,
  count(*) filter (where t.due_date < now() and t.completed = false and t.is_deleted = false) as overdue_tasks,
  count(*) filter (where t.embedding is not null) as tasks_with_embeddings,
  count(distinct tt.tag_id) filter (where tt.is_ai_suggested = true) as ai_suggested_tags_count,
  avg(case when t.completed = true then extract(epoch from (t.completed_at - t.created_at))/86400 else null end) as avg_completion_days
from public.tasks t
left join public.task_tags tt on t.id = tt.task_id
where t.is_deleted = false
group by t.user_id;

-- Grant access to the view
grant select on public.task_analytics to authenticated;

-- Add RLS policy for the view
create policy "Users can view their own analytics"
  on public.task_analytics for select
  using (auth.uid() = user_id);
