-- Function to update the updated_at timestamp
create or replace function private.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Function to automatically create user profile when a user signs up
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create user profile in public.users
  insert into public.users (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email)
  );

  return new;
end;
$$;

-- Function to automatically create user settings when a user is created
create or replace function private.create_user_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id);
  return new;
end;
$$;

-- Function to handle task completion
create or replace function private.handle_task_completion()
returns trigger
language plpgsql
as $$
begin
  -- Set completed_at timestamp when task is marked as completed
  if new.completed = true and old.completed = false then
    new.completed_at = timezone('utc'::text, now());
  elsif new.completed = false and old.completed = true then
    new.completed_at = null;
  end if;
  
  return new;
end;
$$;

-- Function to handle task deletion (soft delete)
create or replace function private.handle_task_deletion()
returns trigger
language plpgsql
as $$
begin
  -- Set deleted_at timestamp when task is marked as deleted
  if new.is_deleted = true and old.is_deleted = false then
    new.deleted_at = timezone('utc'::text, now());
  elsif new.is_deleted = false and old.is_deleted = true then
    new.deleted_at = null;
  end if;
  
  return new;
end;
$$;

-- Function to automatically record action history for important changes
create or replace function private.auto_record_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  action_type text;
  old_data jsonb;
  new_data jsonb;
begin
  -- Determine action type
  if tg_op = 'INSERT' then
    action_type := 'create';
    old_data := null;
    new_data := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    action_type := 'update';
    old_data := to_jsonb(old);
    new_data := to_jsonb(new);
  elsif tg_op = 'DELETE' then
    action_type := 'delete';
    old_data := to_jsonb(old);
    new_data := null;
  end if;
  
  -- Record the action
  insert into public.action_history (
    user_id,
    action_type,
    table_name,
    record_id,
    old_data,
    new_data,
    is_ai_action
  ) values (
    coalesce(
      case when tg_op = 'DELETE' then old.user_id else new.user_id end,
      auth.uid()
    ),
    action_type,
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    old_data,
    new_data,
    false
  );
  
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- Create triggers for updated_at columns
create trigger update_users_updated_at
  before update on public.users
  for each row execute function private.update_updated_at_column();

create trigger update_user_settings_updated_at
  before update on public.user_settings
  for each row execute function private.update_updated_at_column();

create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function private.update_updated_at_column();

create trigger update_billing_details_updated_at
  before update on public.billing_details
  for each row execute function private.update_updated_at_column();

create trigger update_connected_accounts_updated_at
  before update on public.connected_accounts
  for each row execute function private.update_updated_at_column();

create trigger update_areas_updated_at
  before update on public.areas
  for each row execute function private.update_updated_at_column();

create trigger update_project_lists_updated_at
  before update on public.project_lists
  for each row execute function private.update_updated_at_column();

create trigger update_tasks_updated_at
  before update on public.tasks
  for each row execute function private.update_updated_at_column();

create trigger update_tags_updated_at
  before update on public.tags
  for each row execute function private.update_updated_at_column();

-- Create trigger for automatic user profile creation on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Create trigger for automatic user settings creation
create trigger create_user_settings_on_signup
  after insert on public.users
  for each row execute function private.create_user_settings();

-- Create triggers for task state management
create trigger handle_task_completion_trigger
  before update on public.tasks
  for each row execute function private.handle_task_completion();

create trigger handle_task_deletion_trigger
  before update on public.tasks
  for each row execute function private.handle_task_deletion();

-- Create triggers for automatic action history recording
-- Only record history for important tables and operations
create trigger auto_record_tasks_history
  after insert or update or delete on public.tasks
  for each row execute function private.auto_record_action();

create trigger auto_record_project_lists_history
  after insert or update or delete on public.project_lists
  for each row execute function private.auto_record_action();

create trigger auto_record_areas_history
  after insert or update or delete on public.areas
  for each row execute function private.auto_record_action();

create trigger auto_record_tags_history
  after insert or update or delete on public.tags
  for each row execute function private.auto_record_action();

create trigger auto_record_task_tags_history
  after insert or delete on public.task_tags
  for each row execute function private.auto_record_action();

-- Function to validate task data before insert/update
create or replace function private.validate_task_data()
returns trigger
language plpgsql
as $$
begin
  -- Ensure title is not empty after trimming
  new.title := trim(new.title);
  if char_length(new.title) = 0 then
    raise exception 'Task title cannot be empty';
  end if;
  
  -- Validate due_date is not in the past for new tasks (allow updates)
  if tg_op = 'INSERT' and new.due_date is not null and new.due_date < now() then
    raise exception 'Due date cannot be in the past';
  end if;
  
  -- Ensure sort_order is not negative
  if new.sort_order < 0 then
    new.sort_order := 0;
  end if;
  
  return new;
end;
$$;

-- Function to validate tag data
create or replace function private.validate_tag_data()
returns trigger
language plpgsql
as $$
begin
  -- Ensure tag name is not empty after trimming and convert to lowercase
  new.name := trim(lower(new.name));
  if char_length(new.name) = 0 then
    raise exception 'Tag name cannot be empty';
  end if;
  
  -- Validate color format (hex color)
  if new.color is not null and not new.color ~ '^#[0-9a-fA-F]{6}$' then
    new.color := '#6366f1'; -- Default color
  end if;
  
  return new;
end;
$$;

-- Create validation triggers
create trigger validate_task_data_trigger
  before insert or update on public.tasks
  for each row execute function private.validate_task_data();

create trigger validate_tag_data_trigger
  before insert or update on public.tags
  for each row execute function private.validate_tag_data();

-- Function to clean up orphaned records
create or replace function private.cleanup_orphaned_records()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Clean up task_tags for deleted tasks
  delete from public.task_tags
  where task_id in (
    select task_tags.task_id
    from public.task_tags
    left join public.tasks on task_tags.task_id = tasks.id
    where tasks.id is null
  );
  
  -- Clean up old deleted tasks (older than trash_auto_delete_days)
  delete from public.tasks
  where is_deleted = true
  and deleted_at < now() - interval '30 days'; -- Default 30 days, should be configurable per user
  
  -- Clean up old action history (older than 90 days)
  delete from public.action_history
  where created_at < now() - interval '90 days';
end;
$$;

-- Create a function to be called periodically for cleanup
-- This would typically be called by a cron job or scheduled function
create or replace function public.scheduled_cleanup()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.cleanup_orphaned_records();
end;
$$;
