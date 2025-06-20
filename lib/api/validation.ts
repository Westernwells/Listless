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
  action_type: z.enum(['create', 'update', 'delete', 'restore', 'duplicate', 'convert', 'reorder']),
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

// Enhanced reordering validation schemas with improved error handling
export const ReorderMoveSchema = z.object({
  id: z.string({
    required_error: 'ID is required',
    invalid_type_error: 'ID must be a string'
  }).uuid({
    message: 'ID must be a valid UUID format'
  }),
  sort_order: z.number({
    required_error: 'Sort order is required',
    invalid_type_error: 'Sort order must be a number'
  }).int({
    message: 'Sort order must be an integer'
  }).min(0, {
    message: 'Sort order must be non-negative (>= 0)'
  }).max(999999, {
    message: 'Sort order is too large (max: 999999)'
  }),
  parent_id: z.string().uuid({
    message: 'Parent ID must be a valid UUID format'
  }).optional().nullable(),
})

export const ReorderSchema = z.object({
  type: z.enum(['tasks', 'project_lists', 'areas'], {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_type) {
        return { message: 'Entity type must be a string' }
      }
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return { message: `Invalid entity type "${issue.received}". Must be one of: tasks, project_lists, areas` }
      }
      if (issue.code === z.ZodIssueCode.invalid_literal) {
        return { message: 'Entity type is required' }
      }
      return { message: ctx.defaultError }
    }
  }),
  moves: z.array(ReorderMoveSchema).min(1, {
    message: 'At least one move operation is required'
  }).max(100, {
    message: 'Too many move operations (max: 100)'
  }).refine((moves) => {
    // Check for duplicate IDs in the same request
    const ids = moves.map(m => m.id)
    const uniqueIds = new Set(ids)
    return ids.length === uniqueIds.size
  }, {
    message: 'Duplicate IDs found in move operations'
  }),
})

/**
 * Additional type exports for reordering
 */
export type ReorderMoveInput = z.infer<typeof ReorderMoveSchema>
export type ReorderInput = z.infer<typeof ReorderSchema>
