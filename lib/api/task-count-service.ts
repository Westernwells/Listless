/**
 * Task Count API Service
 * Handles efficient task count queries for sidebar counters
 */

import { createClient } from '@/lib/supabase/client'

export interface TaskCountResponse {
  count: number
  error?: string
}

export interface TaskCountsByView {
  inbox: number
  today: number
  scheduled: number
  deferred: number
  completed: number
}

export interface ProjectTaskCount {
  project_id: string
  project_name: string
  count: number
}

/**
 * Task Count Service Class
 * Optimized for fetching only count data without full task objects
 */
export class TaskCountService {
  private supabase = createClient()

  /**
   * Check if error is authentication-related
   */
  private isAuthError(response: Response): boolean {
    return response.status === 401 || response.status === 403
  }

  /**
   * Handle authentication errors gracefully
   */
  private handleAuthError(view: string): TaskCountResponse {
    // Don't log auth errors during logout to avoid console spam
    return { count: 0, error: null }
  }

  /**
   * Get task count for a specific view
   */
  async getViewTaskCount(view: 'inbox' | 'today' | 'scheduled' | 'deferred' | 'completed'): Promise<TaskCountResponse> {
    try {
      const params = new URLSearchParams()
      params.append('view', view)
      params.append('count_only', 'true')

      const response = await fetch(`/api/tasks/count?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Handle authentication errors gracefully
        if (this.isAuthError(response)) {
          return this.handleAuthError(view)
        }

        const errorData = await response.json()
        return { count: 0, error: errorData.message || 'Failed to fetch task count' }
      }

      const result = await response.json()
      return { count: result.data?.count || 0 }
    } catch (error) {
      // Check if this is a network error during logout
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return this.handleAuthError(view)
      }

      console.error(`Error fetching ${view} task count:`, error)
      return { count: 0, error: 'Network error while fetching task count' }
    }
  }

  /**
   * Get task count for a specific project
   */
  async getProjectTaskCount(projectId: string): Promise<TaskCountResponse> {
    try {
      const params = new URLSearchParams()
      params.append('view', 'project')
      params.append('project_list_id', projectId)
      params.append('count_only', 'true')

      const response = await fetch(`/api/tasks/count?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Handle authentication errors gracefully
        if (this.isAuthError(response)) {
          return this.handleAuthError(`project-${projectId}`)
        }

        const errorData = await response.json()
        return { count: 0, error: errorData.message || 'Failed to fetch project task count' }
      }

      const result = await response.json()
      return { count: result.data?.count || 0 }
    } catch (error) {
      // Check if this is a network error during logout
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return this.handleAuthError(`project-${projectId}`)
      }

      console.error(`Error fetching project ${projectId} task count:`, error)
      return { count: 0, error: 'Network error while fetching project task count' }
    }
  }

  /**
   * Get task counts for all main views in a single request
   */
  async getAllViewTaskCounts(): Promise<{ data: TaskCountsByView | null; error: string | null }> {
    try {
      const response = await fetch('/api/tasks/count/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Handle authentication errors gracefully
        if (this.isAuthError(response)) {
          return {
            data: { inbox: 0, today: 0, scheduled: 0, deferred: 0, completed: 0 },
            error: null
          }
        }

        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to fetch task counts' }
      }

      const result = await response.json()
      return { data: result.data, error: null }
    } catch (error) {
      // Check if this is a network error during logout
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return {
          data: { inbox: 0, today: 0, scheduled: 0, deferred: 0, completed: 0 },
          error: null
        }
      }

      console.error('Error fetching all view task counts:', error)
      return { data: null, error: 'Network error while fetching task counts' }
    }
  }

  /**
   * Get task counts for all projects
   */
  async getAllProjectTaskCounts(): Promise<{ data: ProjectTaskCount[] | null; error: string | null }> {
    try {
      const response = await fetch('/api/tasks/count/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Handle authentication errors gracefully
        if (this.isAuthError(response)) {
          return { data: [], error: null }
        }

        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to fetch project task counts' }
      }

      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error) {
      // Check if this is a network error during logout
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { data: [], error: null }
      }

      console.error('Error fetching all project task counts:', error)
      return { data: null, error: 'Network error while fetching project task counts' }
    }
  }
}

// Export singleton instance
export const taskCountService = new TaskCountService()
