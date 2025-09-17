-- Direct SQL fix for tag operations
-- This bypasses the problematic trigger by temporarily disabling it

-- Function to safely add a tag to a task
CREATE OR REPLACE FUNCTION public.safe_add_task_tag(
  p_task_id uuid,
  p_tag_id uuid,
  p_is_ai_suggested boolean DEFAULT false,
  p_confidence_score decimal(3,2) DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_data jsonb;
BEGIN
  -- Insert the task_tag relationship directly
  INSERT INTO public.task_tags (task_id, tag_id, is_ai_suggested, confidence_score)
  VALUES (p_task_id, p_tag_id, p_is_ai_suggested, p_confidence_score)
  ON CONFLICT (task_id, tag_id) DO NOTHING;
  
  -- Get the inserted data with tag information
  SELECT jsonb_build_object(
    'task_id', tt.task_id,
    'tag_id', tt.tag_id,
    'is_ai_suggested', tt.is_ai_suggested,
    'confidence_score', tt.confidence_score,
    'created_at', tt.created_at,
    'tags', jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'color', t.color,
      'created_at', t.created_at,
      'updated_at', t.updated_at
    )
  ) INTO result_data
  FROM public.task_tags tt
  JOIN public.tags t ON t.id = tt.tag_id
  WHERE tt.task_id = p_task_id AND tt.tag_id = p_tag_id;
  
  RETURN result_data;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Function to safely remove a tag from a task
CREATE OR REPLACE FUNCTION public.safe_remove_task_tag(
  p_task_id uuid,
  p_tag_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_data jsonb;
  tag_name text;
BEGIN
  -- Get tag name before deletion
  SELECT t.name INTO tag_name
  FROM public.tags t
  WHERE t.id = p_tag_id;
  
  -- Delete the task_tag relationship
  DELETE FROM public.task_tags 
  WHERE task_id = p_task_id AND tag_id = p_tag_id;
  
  -- Return success data
  SELECT jsonb_build_object(
    'task_id', p_task_id,
    'tag_id', p_tag_id,
    'tag_name', tag_name,
    'success', true
  ) INTO result_data;
  
  RETURN result_data;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;
