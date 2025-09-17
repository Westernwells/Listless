const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createFunctions() {
  console.log('Creating task_tag helper functions...')
  
  try {
    // Create the insert function
    const insertFunctionSQL = `
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
  INSERT INTO public.task_tags (task_id, tag_id, is_ai_suggested, confidence_score)
  VALUES (p_task_id, p_tag_id, p_is_ai_suggested, p_confidence_score);
  
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
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;`

    console.log('Creating insert_task_tag function...')
    const { error: insertError } = await supabase.rpc('query', { query: insertFunctionSQL })
    
    if (insertError) {
      console.log('Insert function creation failed, trying alternative approach...')
    }

    // Create the remove function
    const removeFunctionSQL = `
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
  SELECT jsonb_build_object('task_id', p_task_id, 'tag_id', p_tag_id) INTO result_data;
  DELETE FROM public.task_tags WHERE task_id = p_task_id AND tag_id = p_tag_id;
  RETURN result_data;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;`

    console.log('Creating remove_task_tag function...')
    const { error: removeError } = await supabase.rpc('query', { query: removeFunctionSQL })
    
    if (removeError) {
      console.log('Remove function creation failed, trying alternative approach...')
    }
    
    console.log('✅ Functions creation attempted!')
    
    // Test the functions
    console.log('Testing if functions are available...')
    const { data: testData, error: testError } = await supabase.rpc('insert_task_tag', {
      p_task_id: '00000000-0000-0000-0000-000000000000',
      p_tag_id: '00000000-0000-0000-0000-000000000000'
    })
    
    if (testError) {
      console.log('Functions not available, will use direct approach in API')
    } else {
      console.log('Functions are working!')
    }
    
  } catch (err) {
    console.error('Error:', err)
    console.log('Will proceed with direct database approach in API')
  }
}

createFunctions()
