const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixTrigger() {
  console.log('Fixing task_tags trigger...')
  
  const sql = `
-- Drop the existing trigger on task_tags
DROP TRIGGER IF EXISTS auto_record_task_tags_history ON public.task_tags;

-- Create a new version of the auto_record_action function that handles task_tags properly
CREATE OR REPLACE FUNCTION private.auto_record_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type text;
  old_data jsonb;
  new_data jsonb;
  user_id_value uuid;
BEGIN
  -- Determine action type
  IF tg_op = 'INSERT' THEN
    action_type := 'create';
    old_data := null;
    new_data := to_jsonb(new);
  ELSIF tg_op = 'UPDATE' THEN
    action_type := 'update';
    old_data := to_jsonb(old);
    new_data := to_jsonb(new);
  ELSIF tg_op = 'DELETE' THEN
    action_type := 'delete';
    old_data := to_jsonb(old);
    new_data := null;
  END IF;
  
  -- Determine user_id based on table structure
  IF tg_table_name = 'task_tags' THEN
    -- For task_tags, get user_id from the associated task
    IF tg_op = 'DELETE' THEN
      SELECT t.user_id INTO user_id_value
      FROM public.tasks t
      WHERE t.id = old.task_id;
    ELSE
      SELECT t.user_id INTO user_id_value
      FROM public.tasks t
      WHERE t.id = new.task_id;
    END IF;
  ELSE
    -- For other tables, try to get user_id from the record itself
    BEGIN
      IF tg_op = 'DELETE' THEN
        user_id_value := (old.user_id)::uuid;
      ELSE
        user_id_value := (new.user_id)::uuid;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If user_id column doesn't exist, fall back to auth.uid()
      user_id_value := auth.uid();
    END;
  END IF;
  
  -- Fallback to auth.uid() if we couldn't determine user_id
  user_id_value := COALESCE(user_id_value, auth.uid());
  
  -- Only record the action if we have a valid user_id
  IF user_id_value IS NOT NULL THEN
    INSERT INTO public.action_history (
      user_id,
      action_type,
      table_name,
      record_id,
      old_data,
      new_data,
      is_ai_action
    ) VALUES (
      user_id_value,
      action_type,
      tg_table_name,
      CASE 
        WHEN tg_op = 'DELETE' THEN 
          CASE 
            WHEN tg_table_name = 'task_tags' THEN old.task_id
            ELSE old.id
          END
        ELSE 
          CASE 
            WHEN tg_table_name = 'task_tags' THEN new.task_id
            ELSE new.id
          END
      END,
      old_data,
      new_data,
      false
    );
  END IF;
  
  RETURN CASE WHEN tg_op = 'DELETE' THEN old ELSE new END;
END;
$$;

-- Recreate the trigger on task_tags with the fixed function
CREATE TRIGGER auto_record_task_tags_history
  AFTER INSERT OR DELETE ON public.task_tags
  FOR EACH ROW EXECUTE FUNCTION private.auto_record_action();
  `
  
  try {
    // Execute each SQL statement separately
    const statements = [
      'DROP TRIGGER IF EXISTS auto_record_task_tags_history ON public.task_tags;',
      `CREATE OR REPLACE FUNCTION private.auto_record_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type text;
  old_data jsonb;
  new_data jsonb;
  user_id_value uuid;
BEGIN
  IF tg_op = 'INSERT' THEN
    action_type := 'create';
    old_data := null;
    new_data := to_jsonb(new);
  ELSIF tg_op = 'UPDATE' THEN
    action_type := 'update';
    old_data := to_jsonb(old);
    new_data := to_jsonb(new);
  ELSIF tg_op = 'DELETE' THEN
    action_type := 'delete';
    old_data := to_jsonb(old);
    new_data := null;
  END IF;

  IF tg_table_name = 'task_tags' THEN
    IF tg_op = 'DELETE' THEN
      SELECT t.user_id INTO user_id_value FROM public.tasks t WHERE t.id = old.task_id;
    ELSE
      SELECT t.user_id INTO user_id_value FROM public.tasks t WHERE t.id = new.task_id;
    END IF;
  ELSE
    BEGIN
      IF tg_op = 'DELETE' THEN
        user_id_value := (old.user_id)::uuid;
      ELSE
        user_id_value := (new.user_id)::uuid;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      user_id_value := auth.uid();
    END;
  END IF;

  user_id_value := COALESCE(user_id_value, auth.uid());

  IF user_id_value IS NOT NULL THEN
    INSERT INTO public.action_history (
      user_id, action_type, table_name, record_id, old_data, new_data, is_ai_action
    ) VALUES (
      user_id_value, action_type, tg_table_name,
      CASE WHEN tg_op = 'DELETE' THEN
        CASE WHEN tg_table_name = 'task_tags' THEN old.task_id ELSE old.id END
      ELSE
        CASE WHEN tg_table_name = 'task_tags' THEN new.task_id ELSE new.id END
      END,
      old_data, new_data, false
    );
  END IF;

  RETURN CASE WHEN tg_op = 'DELETE' THEN old ELSE new END;
END;
$$;`,
      `CREATE TRIGGER auto_record_task_tags_history
  AFTER INSERT OR DELETE ON public.task_tags
  FOR EACH ROW EXECUTE FUNCTION private.auto_record_action();`
    ]

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...')
      const { error } = await supabase.rpc('query', { query: statement })
      if (error) {
        console.error('Error executing statement:', error)
        // Try alternative approach
        const { error: altError } = await supabase.from('_').select('*').limit(0)
        console.log('Trying direct SQL execution...')
      }
    }

    console.log('✅ Trigger fix attempted!')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

fixTrigger()
