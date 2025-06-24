/**
 * Task API Service
 * Handles all task-related API operations with proper data transformation
 */

import { createClient } from '@/lib/supabase/client'

// Frontend Task interface (what the UI expects)
export interface FrontendTask {
  id: string
  content: string
  checked: boolean
  dueDate?: string
  flagged?: boolean
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  description?: string
  completedAt?: string
  project_list_id?: string
}

// Backend Task interface (what the API expects/returns)
export interface BackendTask {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  completed_at?: string
  project_list_id?: string
  user_id: string
  sort_order: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  project_lists?: {
    id: string
    name: string
    color?: string
  }
  task_tags?: Array<{
    tags: {
      id: string
      name: string
      color?: string
    }
    is_ai_suggested: boolean
    confidence_score?: number
  }>
}

// Data transformation utilities
export const transformBackendToFrontend = (backendTask: BackendTask): FrontendTask => {
  return {
    id: backendTask.id,
    content: backendTask.title,
    checked: backendTask.completed,
    dueDate: backendTask.due_date,
    flagged: false, // This would need to be added to backend schema if needed
    tags: backendTask.task_tags?.map(tt => tt.tags.name) || [],
    priority: backendTask.priority,
    description: backendTask.description,
    completedAt: backendTask.completed_at,
    project_list_id: backendTask.project_list_id,
  }
}

export const transformFrontendToBackend = (frontendTask: Partial<FrontendTask>): Partial<BackendTask> => {
  const backendData: any = {}

  if (frontendTask.content !== undefined) {
    backendData.title = frontendTask.content
  }
  if (frontendTask.checked !== undefined) {
    backendData.completed = frontendTask.checked
  }
  if (frontendTask.dueDate !== undefined) {
    backendData.due_date = frontendTask.dueDate
  }
  if (frontendTask.priority !== undefined) {
    backendData.priority = frontendTask.priority
  }
  if (frontendTask.description !== undefined) {
    backendData.description = frontendTask.description
  }
  if (frontendTask.project_list_id !== undefined) {
    backendData.project_list_id = frontendTask.project_list_id
  }

  return backendData
}

// API Service Class
export class TaskService {
  private supabase = createClient()

  /**
   * Get all tasks for the current user with optional filtering
   */
  async getTasks(filters?: {
    view?: 'inbox' | 'today' | 'deferred' | 'completed' | 'project'
    project_list_id?: string
    include_completed?: boolean
    include_deleted?: boolean
    due_date?: string
    is_deferred?: boolean
  }): Promise<{ data: FrontendTask[] | null; error: string | null }> {
    try {
      // Build query parameters
      const params = new URLSearchParams()

      if (filters?.view) {
        params.append('view', filters.view)
      }
      if (filters?.project_list_id) {
        params.append('project_list_id', filters.project_list_id)
      }
      if (filters?.include_completed !== undefined) {
        params.append('include_completed', filters.include_completed.toString())
      }
      if (filters?.include_deleted !== undefined) {
        params.append('include_deleted', filters.include_deleted.toString())
      }
      if (filters?.due_date) {
        params.append('due_date', filters.due_date)
      }
      if (filters?.is_deferred !== undefined) {
        params.append('is_deferred', filters.is_deferred.toString())
      }

      const url = `/api/tasks${params.toString() ? '?' + params.toString() : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to fetch tasks' }
      }

      const result = await response.json()
      // result.data is already the array of tasks from the API
      const backendTasks: BackendTask[] = result.data || []

      // Add error handling for transformation
      try {
        const frontendTasks = backendTasks.map(transformBackendToFrontend)
        return { data: frontendTasks, error: null }
      } catch (transformError) {
        console.error('Error transforming tasks:', transformError)
        console.error('Backend tasks data:', backendTasks)
        return { data: null, error: 'Failed to transform task data' }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      return { data: null, error: 'Network error while fetching tasks' }
    }
  }

  /**
   * Get completed tasks for the current user
   */
  async getCompletedTasks(): Promise<{ data: FrontendTask[] | null; error: string | null }> {
    try {
      const response = await fetch('/api/tasks?include_completed=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to fetch completed tasks' }
      }

      const result = await response.json()
      // result.data is already the array of tasks from the API
      const backendTasks: BackendTask[] = result.data || []

      // Filter to only completed tasks on the frontend
      const completedBackendTasks = backendTasks.filter(task => task.completed)

      // Add error handling for transformation
      try {
        const frontendTasks = completedBackendTasks.map(transformBackendToFrontend)
        return { data: frontendTasks, error: null }
      } catch (transformError) {
        console.error('Error transforming completed tasks:', transformError)
        console.error('Backend tasks data:', completedBackendTasks)
        return { data: null, error: 'Failed to transform completed task data' }
      }
    } catch (error) {
      console.error('Error fetching completed tasks:', error)
      return { data: null, error: 'Network error while fetching completed tasks' }
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData: Partial<FrontendTask>): Promise<{ data: FrontendTask | null; error: string | null }> {
    try {
      const backendData = transformFrontendToBackend(taskData)

      // Ensure required fields
      if (!backendData.title) {
        backendData.title = 'New Task'
      }

      // Add required sort_order field (use a smaller value that fits in PostgreSQL integer)
      // Use seconds since epoch instead of milliseconds to stay within integer range
      backendData.sort_order = Math.floor(Date.now() / 1000)

      // Set default priority if not provided
      if (!backendData.priority) {
        backendData.priority = 'medium'
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to create task' }
      }

      const result = await response.json()
      const frontendTask = transformBackendToFrontend(result.data)

      return { data: frontendTask, error: null }
    } catch (error) {
      console.error('Error creating task:', error)
      return { data: null, error: 'Network error while creating task' }
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: Partial<FrontendTask>): Promise<{ data: FrontendTask | null; error: string | null }> {
    try {
      const backendData = transformFrontendToBackend(updates)

      // Debug logging
      console.log('Frontend updates:', updates)
      console.log('Backend data being sent:', backendData)

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to update task' }
      }

      const result = await response.json()
      const frontendTask = transformBackendToFrontend(result.data)

      return { data: frontendTask, error: null }
    } catch (error) {
      console.error('Error updating task:', error)
      return { data: null, error: 'Network error while updating task' }
    }
  }

  /**
   * Delete a task (soft delete)
   */
  async deleteTask(taskId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.message || 'Failed to delete task' }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting task:', error)
      return { success: false, error: 'Network error while deleting task' }
    }
  }

  /**
   * Toggle task completion status
   */
  async toggleTask(taskId: string, completed: boolean): Promise<{ data: FrontendTask | null; error: string | null }> {
    // Use the correct frontend field name for the transformation
    return this.updateTask(taskId, { checked: completed })
  }
}

// Export singleton instance
export const taskService = new TaskService()
