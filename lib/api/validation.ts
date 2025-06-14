import { z } from 'zod'

/**
 * Validation schemas for task management API endpoints
 * These schemas ensure data integrity and provide type safety
 */

// Base task priority enum
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high'])

// Task creation schema
export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().optional(),
  priority: TaskPrioritySchema.default('medium'),
  due_date: z.string().datetime().optional(),
  project_list_id: z.string().uuid().optional(),
  sort_order: z.number().int().min(0).default(0),
})

// Task update schema (partial updates allowed)
export const UpdateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  priority: TaskPrioritySchema.optional(),
  due_date: z.string().datetime().optional().nullable(),
  project_list_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
  is_deleted: z.boolean().optional(),
})

// Task ID parameter schema
export const TaskIdSchema = z.object({
  id: z.string().uuid('Invalid task ID format'),
})

// Restore tasks schema
export const RestoreTasksSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1, 'At least one task ID is required'),
})

// Convert task to project schema
export const ConvertToProjectSchema = z.object({
  project_name: z.string().min(1, 'Project name is required').max(200, 'Project name too long'),
  area_id: z.string().uuid().optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
})

// Query parameters for task listing
export const TaskQuerySchema = z.object({
  project_list_id: z.string().uuid().optional(),
  include_completed: z.string().transform(val => val === 'true').optional(),
  include_deleted: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).optional(),
})

// Project List validation schemas
export const CreateProjectListSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Project name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#6366f1'),
  area_id: z.string().uuid().optional(),
  sort_order: z.number().int().min(0).default(0),
})

export const UpdateProjectListSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Project name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  area_id: z.string().uuid().optional(),
  sort_order: z.number().int().min(0).optional(),
  is_archived: z.boolean().optional(),
})

export const ProjectListIdSchema = z.object({
  id: z.string().uuid('Invalid project ID format'),
})

// Area validation schemas
export const CreateAreaSchema = z.object({
  name: z.string().min(1, 'Area name is required').max(200, 'Area name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#6366f1'),
  sort_order: z.number().int().min(0).default(0),
})

export const UpdateAreaSchema = z.object({
  name: z.string().min(1, 'Area name is required').max(200, 'Area name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  sort_order: z.number().int().min(0).optional(),
  is_archived: z.boolean().optional(),
})

export const AreaIdSchema = z.object({
  id: z.string().uuid('Invalid area ID format'),
})

// Action history entry schema for undo/redo functionality
export const ActionHistorySchema = z.object({
  action_type: z.enum(['create', 'update', 'delete', 'restore', 'duplicate', 'convert']),
  entity_type: z.enum(['task', 'project_list', 'area']),
  entity_id: z.string().uuid(),
  old_data: z.record(z.any()).optional(),
  new_data: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * Type exports for use in API handlers
 */
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
export type TaskIdParams = z.infer<typeof TaskIdSchema>
export type RestoreTasksInput = z.infer<typeof RestoreTasksSchema>
export type ConvertToProjectInput = z.infer<typeof ConvertToProjectSchema>
export type TaskQueryParams = z.infer<typeof TaskQuerySchema>
export type CreateProjectListInput = z.infer<typeof CreateProjectListSchema>
export type UpdateProjectListInput = z.infer<typeof UpdateProjectListSchema>
export type ProjectListIdParams = z.infer<typeof ProjectListIdSchema>
export type CreateAreaInput = z.infer<typeof CreateAreaSchema>
export type UpdateAreaInput = z.infer<typeof UpdateAreaSchema>
export type AreaIdParams = z.infer<typeof AreaIdSchema>
export type ActionHistoryEntry = z.infer<typeof ActionHistorySchema>
