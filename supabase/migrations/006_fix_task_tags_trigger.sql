-- Fix the auto_record_action trigger to handle tables without user_id column
-- This fixes the "record old has no field user_id" error for task_tags operations

-- Updated function to handle tables without user_id column
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
  user_id_value uuid;
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
  
  -- Determine user_id based on table structure
  if tg_table_name = 'task_tags' then
    -- For task_tags, get user_id from the associated task
    if tg_op = 'DELETE' then
      select t.user_id into user_id_value
      from public.tasks t
      where t.id = old.task_id;
    else
      select t.user_id into user_id_value
      from public.tasks t
      where t.id = new.task_id;
    end if;
  else
    -- For other tables, try to get user_id from the record itself
    begin
      if tg_op = 'DELETE' then
        user_id_value := (old.user_id)::uuid;
      else
        user_id_value := (new.user_id)::uuid;
      end if;
    exception when others then
      -- If user_id column doesn't exist, fall back to auth.uid()
      user_id_value := auth.uid();
    end;
  end if;
  
  -- Fallback to auth.uid() if we couldn't determine user_id
  user_id_value := coalesce(user_id_value, auth.uid());
  
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
    user_id_value,
    action_type,
    tg_table_name,
    case 
      when tg_op = 'DELETE' then 
        case 
          when tg_table_name = 'task_tags' then old.task_id
          else old.id
        end
      else 
        case 
          when tg_table_name = 'task_tags' then new.task_id
          else new.id
        end
    end,
    old_data,
    new_data,
    false
  );
  
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
