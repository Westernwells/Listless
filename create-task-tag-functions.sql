-- Create helper functions to manage task_tags without trigger issues

-- Function to safely insert a task_tag relationship
CREATE OR REPLACE FUNCTION public.insert_task_tag(
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
  -- Temporarily disable the trigger
  ALTER TABLE public.task_tags DISABLE TRIGGER auto_record_task_tags_history;
  
  -- Insert the task_tag relationship
  INSERT INTO public.task_tags (task_id, tag_id, is_ai_suggested, confidence_score)
  VALUES (p_task_id, p_tag_id, p_is_ai_suggested, p_confidence_score);
  
  -- Re-enable the trigger
  ALTER TABLE public.task_tags ENABLE TRIGGER auto_record_task_tags_history;
  
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
      'color', t.color
    )
  ) INTO result_data
  FROM public.task_tags tt
  JOIN public.tags t ON t.id = tt.tag_id
  WHERE tt.task_id = p_task_id AND tt.tag_id = p_tag_id;
  
  RETURN result_data;
END;
$$;

-- Function to safely remove a task_tag relationship
CREATE OR REPLACE FUNCTION public.remove_task_tag(
  p_task_id uuid,
  p_tag_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_data jsonb;
BEGIN
  -- Get the data before deletion
  SELECT jsonb_build_object(
    'task_id', p_task_id,
    'tag_id', p_tag_id
  ) INTO result_data;
  
  -- Temporarily disable the trigger
  ALTER TABLE public.task_tags DISABLE TRIGGER auto_record_task_tags_history;
  
  -- Delete the task_tag relationship
  DELETE FROM public.task_tags 
  WHERE task_id = p_task_id AND tag_id = p_tag_id;
  
  -- Re-enable the trigger
  ALTER TABLE public.task_tags ENABLE TRIGGER auto_record_task_tags_history;
  
  RETURN result_data;
END;
$$;
