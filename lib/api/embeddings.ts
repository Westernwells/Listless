import OpenAI from 'openai'

/**
 * OpenAI client for generating embeddings
 * Used for AI auto-tagging functionality
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generates an embedding vector for task content using OpenAI's text-embedding-3-small model
 * This is used for AI-powered auto-tagging and semantic search functionality
 */
export async function generateTaskEmbedding(content: string): Promise<number[] | null> {
  try {
    // Skip embedding generation if no API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, skipping embedding generation')
      return null
    }

    // Combine title and description for embedding
    const textToEmbed = content.trim()
    
    // Skip if content is too short or empty
    if (textToEmbed.length < 3) {
      return null
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: textToEmbed,
      encoding_format: 'float',
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    // Don't fail the entire operation if embedding generation fails
    return null
  }
}

/**
 * Prepares task content for embedding generation
 * Combines title and description in a meaningful way
 */
export function prepareTaskContentForEmbedding(title: string, description?: string): string {
  const parts = [title]
  
  if (description && description.trim()) {
    parts.push(description.trim())
  }
  
  return parts.join(' - ')
}

/**
 * Determines if task content has changed significantly enough to regenerate embedding
 * This helps avoid unnecessary API calls to OpenAI
 */
export function shouldRegenerateEmbedding(
  oldTitle?: string,
  newTitle?: string,
  oldDescription?: string,
  newDescription?: string
): boolean {
  // If title changed, always regenerate
  if (oldTitle !== newTitle) {
    return true
  }
  
  // If description changed, regenerate
  if (oldDescription !== newDescription) {
    return true
  }
  
  return false
}

/**
 * Batch generates embeddings for multiple tasks
 * Useful for bulk operations or migrations
 */
export async function generateBatchEmbeddings(
  tasks: Array<{ id: string; title: string; description?: string }>
): Promise<Array<{ id: string; embedding: number[] | null }>> {
  const results = []
  
  // Process in batches to avoid rate limits
  const batchSize = 10
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async (task) => {
      const content = prepareTaskContentForEmbedding(task.title, task.description)
      const embedding = await generateTaskEmbedding(content)
      return { id: task.id, embedding }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // Add a small delay between batches to respect rate limits
    if (i + batchSize < tasks.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}
