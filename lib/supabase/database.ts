import { createClient } from './client'
import { createClient as createServerClient } from './server'
import type { Database } from './types'

/**
 * Database utility functions for common operations
 * These functions provide a higher-level interface for database operations
 */

// Type definitions for common operations
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type TaskRow = Database['public']['Tables']['tasks']['Row']

export type ProjectListInsert = Database['public']['Tables']['project_lists']['Insert']
export type ProjectListUpdate = Database['public']['Tables']['project_lists']['Update']
export type ProjectListRow = Database['public']['Tables']['project_lists']['Row']

export type AreaInsert = Database['public']['Tables']['areas']['Insert']
export type AreaUpdate = Database['public']['Tables']['areas']['Update']
export type AreaRow = Database['public']['Tables']['areas']['Row']

export type TagInsert = Database['public']['Tables']['tags']['Insert']
export type TagUpdate = Database['public']['Tables']['tags']['Update']
export type TagRow = Database['public']['Tables']['tags']['Row']

export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert']
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']
export type UserSettingsRow = Database['public']['Tables']['user_settings']['Row']

/**
 * Task-related database operations
 */
export class TaskDatabase {
  private supabase = createClient()

  async getTasks(projectListId?: string, includeCompleted = false) {
    try {
      let query = this.supabase
        .from('tasks')
        .select(`
          *,
          project_lists (
            id,
            name,
            color
          ),
          task_tags (
            tags (
              id,
              name,
              color
            ),
            is_ai_suggested,
            confidence_score
          )
        `)
        .eq('is_deleted', false)
        .order('sort_order', { ascending: true })

      if (projectListId) {
        query = query.eq('project_list_id', projectListId)
      }

      if (!includeCompleted) {
        query = query.eq('completed', false)
      }

      const result = await query

      if (result.error) {
        console.error('Database error in getTasks:', result.error)
        throw handleDatabaseError(result.error)
      }

      return result
    } catch (error) {
      console.error('Error in getTasks:', error)
      throw error
    }
  }

  async createTask(task: TaskInsert) {
    try {
      const result = await this.supabase
        .from('tasks')
        .insert(task)
        .select()
        .single()

      if (result.error) {
        console.error('Database error in createTask:', result.error)
        throw handleDatabaseError(result.error)
      }

      return result
    } catch (error) {
      console.error('Error in createTask:', error)
      throw error
    }
  }

  async updateTask(id: string, updates: TaskUpdate) {
    try {
      const result = await this.supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (result.error) {
        console.error('Database error in updateTask:', result.error)
        throw handleDatabaseError(result.error)
      }

      return result
    } catch (error) {
      console.error('Error in updateTask:', error)
      throw error
    }
  }

  async deleteTask(id: string, permanent = false) {
    try {
      let result
      if (permanent) {
        result = await this.supabase
          .from('tasks')
          .delete()
          .eq('id', id)
      } else {
        result = await this.supabase
          .from('tasks')
          .update({ is_deleted: true })
          .eq('id', id)
      }

      if (result.error) {
        console.error('Database error in deleteTask:', result.error)
        throw handleDatabaseError(result.error)
      }

      return result
    } catch (error) {
      console.error('Error in deleteTask:', error)
      throw error
    }
  }

  async restoreTask(id: string) {
    return this.supabase
      .from('tasks')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', id)
  }

  async searchTasks(query: string, embedding?: number[]) {
    if (embedding) {
      // Use vector similarity search
      return this.supabase.rpc('match_tasks', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 20
      })
    } else {
      // Use text search
      return this.supabase
        .from('tasks')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(20)
    }
  }

  async updateTaskEmbedding(taskId: string, embedding: number[]) {
    return this.supabase.rpc('update_task_embedding', {
      task_id: taskId,
      new_embedding: embedding
    })
  }

  async suggestTags(taskId: string) {
    return this.supabase.rpc('suggest_tags_for_task', {
      task_id: taskId,
      match_threshold: 0.75,
      max_suggestions: 5
    })
  }
}

/**
 * Project and Area database operations
 */
export class ProjectDatabase {
  private supabase = createClient()

  async getAreas() {
    try {
      const result = await this.supabase
        .from('areas')
        .select(`
          *,
          project_lists (
            id,
            name,
            description,
            color,
            sort_order,
            is_archived
          )
        `)
        .eq('is_archived', false)
        .order('sort_order', { ascending: true })

      if (result.error) {
        console.error('Database error in getAreas:', result.error)
        throw handleDatabaseError(result.error)
      }

      return result
    } catch (error) {
      console.error('Error in getAreas:', error)
      throw error
    }
  }

  async getProjectLists(areaId?: string) {
    let query = this.supabase
      .from('project_lists')
      .select('*')
      .eq('is_archived', false)
      .order('sort_order', { ascending: true })

    if (areaId) {
      query = query.eq('area_id', areaId)
    }

    return query
  }

  async createArea(area: AreaInsert) {
    return this.supabase
      .from('areas')
      .insert(area)
      .select()
      .single()
  }

  async createProjectList(project: ProjectListInsert) {
    return this.supabase
      .from('project_lists')
      .insert(project)
      .select()
      .single()
  }

  async updateArea(id: string, updates: AreaUpdate) {
    return this.supabase
      .from('areas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  async updateProjectList(id: string, updates: ProjectListUpdate) {
    return this.supabase
      .from('project_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  async deleteArea(id: string) {
    return this.supabase
      .from('areas')
      .update({ is_archived: true })
      .eq('id', id)
  }

  async deleteProjectList(id: string) {
    return this.supabase
      .from('project_lists')
      .update({ is_archived: true })
      .eq('id', id)
  }
}

/**
 * Tag database operations
 */
export class TagDatabase {
  private supabase = createClient()

  async getTags() {
    return this.supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })
  }

  async createTag(tag: TagInsert) {
    return this.supabase
      .from('tags')
      .insert(tag)
      .select()
      .single()
  }

  async updateTag(id: string, updates: TagUpdate) {
    return this.supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  async deleteTag(id: string) {
    return this.supabase
      .from('tags')
      .delete()
      .eq('id', id)
  }

  async addTagToTask(taskId: string, tagId: string, isAiSuggested = false, confidenceScore?: number) {
    return this.supabase
      .from('task_tags')
      .insert({
        task_id: taskId,
        tag_id: tagId,
        is_ai_suggested: isAiSuggested,
        confidence_score: confidenceScore
      })
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    return this.supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)
      .eq('tag_id', tagId)
  }

  async getTaskTags(taskId: string) {
    return this.supabase
      .from('task_tags')
      .select(`
        *,
        tags (
          id,
          name,
          color
        )
      `)
      .eq('task_id', taskId)
  }
}

/**
 * User settings database operations
 */
export class UserDatabase {
  private supabase = createClient()

  async getUserSettings() {
    return this.supabase
      .from('user_settings')
      .select('*')
      .single()
  }

  async updateUserSettings(updates: UserSettingsUpdate) {
    return this.supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', (await this.supabase.auth.getUser()).data.user?.id)
      .select()
      .single()
  }

  async getTaskStatistics() {
    return this.supabase.rpc('get_task_statistics')
  }

  async getActionHistory(limit = 50, offset = 0, tableFilter?: string) {
    return this.supabase.rpc('get_action_history', {
      limit_count: limit,
      offset_count: offset,
      table_filter: tableFilter
    })
  }

  async cleanupOldActionHistory(daysToKeep = 90) {
    return this.supabase.rpc('cleanup_old_action_history', {
      days_to_keep: daysToKeep
    })
  }
}

/**
 * Convenience exports for easy access
 */
export const taskDb = new TaskDatabase()
export const projectDb = new ProjectDatabase()
export const tagDb = new TagDatabase()
export const userDb = new UserDatabase()

/**
 * Error handling utility
 */
export function handleDatabaseError(error: any) {
  console.error('Database error:', error)

  // Handle RLS policy violations (403 Forbidden)
  if (error?.code === 'PGRST301' || error?.status === 403) {
    throw new Error('You do not have permission to perform this action. Please check your authentication status.')
  }

  // Handle authentication errors
  if (error?.code === 'PGRST001' || error?.status === 401) {
    throw new Error('Authentication required. Please log in and try again.')
  }

  // Handle unique constraint violations
  if (error?.code === '23505') {
    throw new Error('This item already exists')
  }

  // Handle foreign key constraint violations
  if (error?.code === '23503') {
    throw new Error('Cannot delete this item because it is referenced by other items')
  }

  // Handle network/connection errors
  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    throw new Error('Network error. Please check your connection and try again.')
  }

  // Handle timeout errors
  if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT') {
    throw new Error('Request timed out. Please try again.')
  }

  throw new Error(error?.message || 'An unexpected database error occurred')
}
