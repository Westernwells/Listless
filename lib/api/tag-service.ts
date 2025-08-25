/**
 * Tag API Service
 * Handles all tag-related API operations with proper data transformation
 */

import { createClient } from '@/lib/supabase/client'

// Frontend Tag interface (what the UI expects)
export interface FrontendTag {
  id: string
  name: string
  color?: string
  created_at?: string
  updated_at?: string
}

// Backend Tag interface (what the API expects/returns)
export interface BackendTag {
  id: string
  name: string
  color?: string
  user_id: string
  is_system: boolean
  created_at: string
  updated_at: string
}

// Task Tag relationship interface
export interface TaskTagRelation {
  task_id: string
  tag_id: string
  is_ai_suggested: boolean
  confidence_score?: number
  created_at: string
}

// Data transformation utilities
export const transformBackendTagToFrontend = (backendTag: BackendTag): FrontendTag => {
  return {
    id: backendTag.id,
    name: backendTag.name,
    color: backendTag.color,
    created_at: backendTag.created_at,
    updated_at: backendTag.updated_at,
  }
}

export const transformFrontendTagToBackend = (frontendTag: Partial<FrontendTag>): Partial<BackendTag> => {
  const backendTag: Partial<BackendTag> = {}
  
  if (frontendTag.name !== undefined) backendTag.name = frontendTag.name
  if (frontendTag.color !== undefined) backendTag.color = frontendTag.color
  
  return backendTag
}

/**
 * Tag service class for handling all tag-related API operations
 */
export class TagService {
  private supabase = createClient()

  /**
   * Get all tags for the current user
   */
  async getAllTags(): Promise<{ data: FrontendTag[] | null; error: string | null }> {
    try {
      const response = await fetch('/api/tags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to fetch tags' }
      }

      const result = await response.json()
      const tags = result.data?.map(transformBackendTagToFrontend) || []
      
      return { data: tags, error: null }
    } catch (error) {
      console.error('Error fetching tags:', error)
      return { data: null, error: 'Network error while fetching tags' }
    }
  }

  /**
   * Create a new tag
   */
  async createTag(tagData: Partial<FrontendTag>): Promise<{ data: FrontendTag | null; error: string | null }> {
    try {
      const backendData = transformFrontendTagToBackend(tagData)

      // Ensure required fields
      if (!backendData.name) {
        return { data: null, error: 'Tag name is required' }
      }

      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to create tag' }
      }

      const result = await response.json()
      const tag = transformBackendTagToFrontend(result.data)
      
      return { data: tag, error: null }
    } catch (error) {
      console.error('Error creating tag:', error)
      return { data: null, error: 'Network error while creating tag' }
    }
  }

  /**
   * Delete a tag
   */
  async deleteTag(tagId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.message || 'Failed to delete tag' }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting tag:', error)
      return { success: false, error: 'Network error while deleting tag' }
    }
  }

  /**
   * Add a tag to a task
   */
  async addTagToTask(
    taskId: string, 
    tagId: string, 
    options?: { isAiSuggested?: boolean; confidenceScore?: number }
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const requestBody = {
        tag_id: tagId,
        is_ai_suggested: options?.isAiSuggested || false,
        confidence_score: options?.confidenceScore,
      }

      const response = await fetch(`/api/tasks/${taskId}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.message || 'Failed to add tag to task' }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error adding tag to task:', error)
      return { success: false, error: 'Network error while adding tag to task' }
    }
  }

  /**
   * Remove a tag from a task
   */
  async removeTagFromTask(taskId: string, tagId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await fetch(`/api/tasks/${taskId}/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.message || 'Failed to remove tag from task' }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error removing tag from task:', error)
      return { success: false, error: 'Network error while removing tag from task' }
    }
  }

  /**
   * Get all tags for a specific task
   */
  async getTaskTags(taskId: string): Promise<{ data: FrontendTag[] | null; error: string | null }> {
    try {
      const response = await fetch(`/api/tasks/${taskId}/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to fetch task tags' }
      }

      const result = await response.json()
      const tags = result.data?.map((item: any) => transformBackendTagToFrontend(item.tags)) || []

      return { data: tags, error: null }
    } catch (error) {
      console.error('Error fetching task tags:', error)
      return { data: null, error: 'Network error while fetching task tags' }
    }
  }

  /**
   * Get usage count for a specific tag
   */
  async getTagUsageCount(tagId: string): Promise<{ data: { tag_id: string; tag_name: string; usage_count: number } | null; error: string | null }> {
    try {
      const response = await fetch(`/api/tags/${tagId}/usage-count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to fetch tag usage count' }
      }

      const result = await response.json()
      return { data: result.data, error: null }
    } catch (error) {
      console.error('Error fetching tag usage count:', error)
      return { data: null, error: 'Network error while fetching tag usage count' }
    }
  }
}

// Export singleton instance
export const tagService = new TagService()
