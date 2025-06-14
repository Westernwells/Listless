-- Function to perform vector similarity search on tasks
create or replace function public.match_tasks(
  query_embedding vector(1536),
  match_threshold float default 0.78,
  match_count int default 10,
  filter_user_id uuid default null
)
returns table (
  id uuid,
  title text,
  description text,
  completed boolean,
  priority priority_level,
  due_date timestamp with time zone,
  project_list_id uuid,
  user_id uuid,
  similarity float,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    tasks.id,
    tasks.title,
    tasks.description,
    tasks.completed,
    tasks.priority,
    tasks.due_date,
    tasks.project_list_id,
    tasks.user_id,
    1 - (tasks.embedding <=> query_embedding) as similarity,
    tasks.created_at,
    tasks.updated_at
  from public.tasks
  where 
    tasks.embedding is not null
    and tasks.is_deleted = false
    and (filter_user_id is null or tasks.user_id = filter_user_id)
    and (filter_user_id is null or tasks.user_id = auth.uid()) -- RLS enforcement
    and 1 - (tasks.embedding <=> query_embedding) > match_threshold
  order by tasks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Function to suggest tags based on task content similarity
create or replace function public.suggest_tags_for_task(
  task_id uuid,
  match_threshold float default 0.75,
  max_suggestions int default 5
)
returns table (
  tag_id uuid,
  tag_name text,
  tag_color text,
  confidence_score float
)
language plpgsql
security definer
set search_path = public
as $$
declare
  task_embedding vector(1536);
  task_user_id uuid;
begin
  -- Get the task embedding and verify ownership
  select embedding, user_id into task_embedding, task_user_id
  from public.tasks
  where id = task_id and user_id = auth.uid();
  
  if task_embedding is null or task_user_id != auth.uid() then
    return;
  end if;
  
  return query
  select
    tags.id as tag_id,
    tags.name as tag_name,
    tags.color as tag_color,
    avg(1 - (similar_tasks.embedding <=> task_embedding)) as confidence_score
  from public.tags
  join public.task_tags on tags.id = task_tags.tag_id
  join public.tasks similar_tasks on task_tags.task_id = similar_tasks.id
  where 
    tags.user_id = auth.uid()
    and similar_tasks.user_id = auth.uid()
    and similar_tasks.embedding is not null
    and similar_tasks.id != suggest_tags_for_task.task_id
    and 1 - (similar_tasks.embedding <=> task_embedding) > match_threshold
    and not exists (
      select 1 from public.task_tags existing_tags
      where existing_tags.task_id = suggest_tags_for_task.task_id
      and existing_tags.tag_id = tags.id
    )
  group by tags.id, tags.name, tags.color
  having count(*) >= 2 -- Tag must appear on at least 2 similar tasks
  order by confidence_score desc
  limit max_suggestions;
end;
$$;

-- Function to create or update task embedding
create or replace function public.update_task_embedding(
  task_id uuid,
  new_embedding vector(1536)
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tasks
  set 
    embedding = new_embedding,
    updated_at = now()
  where 
    id = task_id 
    and user_id = auth.uid();
  
  return found;
end;
$$;

-- Function to batch update embeddings
create or replace function public.batch_update_embeddings(
  task_embeddings jsonb -- Array of {task_id, embedding} objects
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count int := 0;
  task_data jsonb;
begin
  for task_data in select jsonb_array_elements(task_embeddings)
  loop
    update public.tasks
    set 
      embedding = (task_data->>'embedding')::vector(1536),
      updated_at = now()
    where 
      id = (task_data->>'task_id')::uuid
      and user_id = auth.uid();
    
    if found then
      updated_count := updated_count + 1;
    end if;
  end loop;
  
  return updated_count;
end;
$$;

-- Function to record action history
create or replace function public.record_action(
  action_type text,
  table_name text,
  record_id uuid,
  old_data jsonb default null,
  new_data jsonb default null,
  batch_id uuid default null,
  is_ai_action boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  action_id uuid;
begin
  insert into public.action_history (
    user_id,
    action_type,
    table_name,
    record_id,
    old_data,
    new_data,
    batch_id,
    is_ai_action
  ) values (
    auth.uid(),
    record_action.action_type,
    record_action.table_name,
    record_action.record_id,
    record_action.old_data,
    record_action.new_data,
    record_action.batch_id,
    record_action.is_ai_action
  )
  returning id into action_id;
  
  return action_id;
end;
$$;

-- Function to get user's action history with pagination
create or replace function public.get_action_history(
  limit_count int default 50,
  offset_count int default 0,
  table_filter text default null,
  batch_filter uuid default null
)
returns table (
  id uuid,
  action_type text,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  batch_id uuid,
  is_ai_action boolean,
  created_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    ah.id,
    ah.action_type,
    ah.table_name,
    ah.record_id,
    ah.old_data,
    ah.new_data,
    ah.batch_id,
    ah.is_ai_action,
    ah.created_at
  from public.action_history ah
  where 
    ah.user_id = auth.uid()
    and (table_filter is null or ah.table_name = table_filter)
    and (batch_filter is null or ah.batch_id = batch_filter)
  order by ah.created_at desc
  limit limit_count
  offset offset_count;
end;
$$;

-- Function to clean up old action history
create or replace function public.cleanup_old_action_history(
  days_to_keep int default 90
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  delete from public.action_history
  where 
    user_id = auth.uid()
    and created_at < now() - (days_to_keep || ' days')::interval;
  
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Function to get task statistics
create or replace function public.get_task_statistics()
returns table (
  total_tasks bigint,
  completed_tasks bigint,
  pending_tasks bigint,
  overdue_tasks bigint,
  tasks_with_embeddings bigint,
  ai_suggested_tags bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    count(*) as total_tasks,
    count(*) filter (where completed = true) as completed_tasks,
    count(*) filter (where completed = false and is_deleted = false) as pending_tasks,
    count(*) filter (where due_date < now() and completed = false and is_deleted = false) as overdue_tasks,
    count(*) filter (where embedding is not null) as tasks_with_embeddings,
    (select count(*) from public.task_tags tt 
     join public.tasks t on tt.task_id = t.id 
     where t.user_id = auth.uid() and tt.is_ai_suggested = true) as ai_suggested_tags
  from public.tasks
  where user_id = auth.uid() and is_deleted = false;
end;
$$;
