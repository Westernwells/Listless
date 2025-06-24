/**
 * Database type definitions for Supabase
 * This file will be auto-generated after the database schema is created
 * using: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Tables will be defined here after schema generation
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
        Relationships: any[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Placeholder types that will be replaced with actual generated types
export type User = {
  id: string
  name?: string
  avatar_url?: string
  bio?: string
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

export type UserSettings = {
  user_id: string
  theme: string
  language: string
  timezone: string
  date_format: string
  time_format: string
  ai_auto_tagging_enabled: boolean
  ai_smart_grouping_enabled: boolean
  trash_auto_delete_days: number
  show_completed_tasks_default: boolean
  tooltips_enabled: boolean
  notifications_email_enabled: boolean
  notifications_in_app_enabled: boolean
  notifications_push_enabled: boolean
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  project_list_id?: string
  user_id: string
  is_deferred: boolean
  sort_order: number
  is_deleted: boolean
  deleted_at?: string
  embedding?: number[] // Vector embedding for AI operations
  created_at: string
  updated_at: string
}

export type ProjectList = {
  id: string
  name: string
  description?: string
  color?: string
  area_id?: string
  user_id: string
  sort_order: number
  is_archived: boolean
  is_template: boolean
  created_at: string
  updated_at: string
}

export type Area = {
  id: string
  name: string
  description?: string
  color?: string
  user_id: string
  sort_order: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type Tag = {
  id: string
  name: string
  color?: string
  user_id: string
  created_at: string
  updated_at: string
}

export type TaskTag = {
  task_id: string
  tag_id: string
  is_ai_suggested: boolean
  batch_id?: string
  created_at: string
}

export type ActionHistory = {
  id: string
  user_id: string
  action_type: string
  table_name: string
  record_id: string
  old_data?: Json
  new_data?: Json
  batch_id?: string
  created_at: string
}

// Enhanced reordering types with better type safety
export type ReorderMove = {
  readonly id: string
  readonly sort_order: number
  readonly parent_id?: string | null
}

export type ReorderRequest = {
  readonly type: 'tasks' | 'project_lists' | 'areas'
  readonly moves: readonly ReorderMove[]
}

export type ReorderResponse = {
  readonly type: string
  readonly affectedIds: readonly string[]
  readonly moveCount: number
  readonly actionHistoryRecorded: boolean
  readonly timestamp: string
}

// Enhanced error handling types following TypeScript best practices
export type ReorderError = {
  readonly success: false
  readonly error: string
  readonly details?: Record<string, unknown>
  readonly timestamp: string
}

export type ReorderSuccess = {
  readonly success: true
  readonly affectedIds: readonly string[]
  readonly timestamp: string
}

export type ReorderResult = ReorderSuccess | ReorderError

// Validation error types for better error handling
export type ValidationError = {
  readonly field: string
  readonly message: string
  readonly code: string
  readonly received?: unknown
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: readonly ValidationError[] }
