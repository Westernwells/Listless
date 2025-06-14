-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.user_settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_details enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.areas enable row level security;
alter table public.project_lists enable row level security;
alter table public.tasks enable row level security;
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;
alter table public.action_history enable row level security;

-- Create a private schema for security definer functions
create schema if not exists private;

-- Helper function to get current user ID
create or replace function private.get_current_user_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select auth.uid();
$$;

-- Helper function to check if user owns a record
create or replace function private.user_owns_record(table_name text, record_id uuid, user_column text default 'user_id')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  owns_record boolean := false;
  query_text text;
begin
  query_text := format('select exists(select 1 from %I where id = $1 and %I = $2)', table_name, user_column);
  execute query_text using record_id, auth.uid() into owns_record;
  return owns_record;
end;
$$;

-- Users table policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- User settings policies
create policy "Users can view their own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

-- Subscriptions policies
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can update their own subscriptions"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert their own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

-- Billing details policies
create policy "Users can view their own billing details"
  on public.billing_details for select
  using (auth.uid() = user_id);

create policy "Users can update their own billing details"
  on public.billing_details for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert their own billing details"
  on public.billing_details for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own billing details"
  on public.billing_details for delete
  using (auth.uid() = user_id);

-- Connected accounts policies
create policy "Users can view their own connected accounts"
  on public.connected_accounts for select
  using (auth.uid() = user_id);

create policy "Users can manage their own connected accounts"
  on public.connected_accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Areas policies
create policy "Users can view their own areas"
  on public.areas for select
  using (auth.uid() = user_id);

create policy "Users can manage their own areas"
  on public.areas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Project lists policies
create policy "Users can view their own project lists"
  on public.project_lists for select
  using (auth.uid() = user_id);

create policy "Users can manage their own project lists"
  on public.project_lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tasks policies (with AI auto-tagging support)
create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can manage their own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tags policies
create policy "Users can view their own tags"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "Users can manage their own tags"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Task tags policies (with AI operations support)
create policy "Users can view task tags for their tasks"
  on public.task_tags for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_tags.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Users can manage task tags for their tasks"
  on public.task_tags for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_tags.task_id
      and tasks.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_tags.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Action history policies (with batch operations support)
create policy "Users can view their own action history"
  on public.action_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own action history"
  on public.action_history for insert
  with check (auth.uid() = user_id);

-- Note: Action history should generally not be updated or deleted by users
-- Only allow deletion for cleanup purposes with specific conditions
create policy "Users can delete old action history"
  on public.action_history for delete
  using (
    auth.uid() = user_id 
    and created_at < now() - interval '90 days'
  );

-- Create functions for AI auto-tagging operations
create or replace function private.can_perform_ai_operation(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.uid() = target_user_id;
$$;

-- Function to validate AI batch operations
create or replace function private.validate_ai_batch_operation(batch_id uuid, target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  batch_user_id uuid;
begin
  -- Check if the batch belongs to the target user
  select user_id into batch_user_id
  from public.action_history
  where action_history.batch_id = validate_ai_batch_operation.batch_id
  limit 1;
  
  return batch_user_id = target_user_id and auth.uid() = target_user_id;
end;
$$;
