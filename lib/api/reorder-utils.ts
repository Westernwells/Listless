import { createClient } from '@/lib/supabase/server'
import { ReorderMoveInput } from './validation'

/**
 * Utility functions for handling reordering operations
 * Provides efficient batch updates and concurrency control
 */

export interface ReorderResult {
  success: boolean
  error?: string
  affectedIds?: string[]
}

/**
 * Validates that a move operation is valid (prevents circular references, etc.)
 */
export function validateMoveOperation(
  entityType: 'tasks' | 'project_lists' | 'areas',
  move: ReorderMoveInput,
  existingData: Record<string, any>[]
): { valid: boolean; error?: string } {
  // Check if entity exists
  const entity = existingData.find(item => item.id === move.id)
  if (!entity) {
    return { valid: false, error: `${entityType.slice(0, -1)} with ID ${move.id} not found` }
  }

  // For areas, parent_id should always be null
  if (entityType === 'areas' && move.parent_id !== null) {
    return { valid: false, error: 'Areas cannot have parent containers' }
  }

  // For project_lists, parent_id should be an area_id or null
  if (entityType === 'project_lists' && move.parent_id) {
    const parentExists = existingData.some(item => item.id === move.parent_id)
    if (!parentExists) {
      return { valid: false, error: `Parent area with ID ${move.parent_id} not found` }
    }
  }

  // For tasks, parent_id should be a project_list_id or null
  if (entityType === 'tasks' && move.parent_id) {
    // We'll validate this against project_lists in the main function
    // since we don't have project_lists data in this context
  }

  // Prevent circular references for hierarchical entities
  if (entityType === 'project_lists' && move.parent_id === move.id) {
    return { valid: false, error: 'Cannot move project list to itself' }
  }

  return { valid: true }
}

/**
 * Performs batch reordering of tasks
 */
/**
 * Enhanced error handling utility for database operations
 */
function handleDatabaseError(error: unknown, operation: string): ReorderResult {
  // Type-safe error handling following TypeScript best practices
  if (error instanceof Error) {
    console.error(`Database error during ${operation}:`, error.message)
    return {
      success: false,
      error: `Database operation failed: ${error.message}`
    }
  }

  if (typeof error === 'string') {
    console.error(`Database error during ${operation}:`, error)
    return {
      success: false,
      error: `Database operation failed: ${error}`
    }
  }

  // Handle unknown error types
  console.error(`Unknown error during ${operation}:`, error)
  return {
    success: false,
    error: `Unexpected error during ${operation}`
  }
}

export async function reorderTasks(
  userId: string,
  moves: ReorderMoveInput[]
): Promise<ReorderResult> {
  try {
    const supabase = await createClient()

    // Start transaction
    const { data: existingTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, project_list_id, sort_order, title')
      .eq('user_id', userId)
      .in('id', moves.map(m => m.id))

    if (fetchError) {
      return { success: false, error: `Failed to fetch tasks: ${fetchError.message}` }
    }

    if (!existingTasks || existingTasks.length !== moves.length) {
      return { success: false, error: 'Some tasks not found or access denied' }
    }

    // Validate parent_ids exist if specified
    const parentIds = moves.filter(m => m.parent_id).map(m => m.parent_id!)
    if (parentIds.length > 0) {
      const { data: parentProjects, error: parentError } = await supabase
        .from('project_lists')
        .select('id')
        .eq('user_id', userId)
        .in('id', parentIds)

      if (parentError) {
        return { success: false, error: `Failed to validate parent projects: ${parentError.message}` }
      }

      if (!parentProjects || parentProjects.length !== parentIds.length) {
        return { success: false, error: 'Some parent projects not found or access denied' }
      }
    }

    // Validate all moves
    for (const move of moves) {
      const validation = validateMoveOperation('tasks', move, existingTasks)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }
    }

    // Perform batch update with explicit null handling
    const updates = moves.map(move => ({
      id: move.id,
      sort_order: move.sort_order,
      project_list_id: move.parent_id === null || move.parent_id === undefined ? null : move.parent_id,
      updated_at: new Date().toISOString(),
    }))

    // Use upsert for batch update
    const { error: updateError } = await supabase
      .from('tasks')
      .upsert(updates, { onConflict: 'id' })

    if (updateError) {
      return { success: false, error: `Failed to update tasks: ${updateError.message}` }
    }

    return {
      success: true,
      affectedIds: moves.map(m => m.id)
    }
  } catch (error: unknown) {
    return handleDatabaseError(error, 'task reordering')
  }
}

/**
 * Performs batch reordering of project lists
 */
export async function reorderProjectLists(
  userId: string,
  moves: ReorderMoveInput[]
): Promise<ReorderResult> {
  try {
    const supabase = await createClient()

    // Fetch existing project lists
    const { data: existingProjects, error: fetchError } = await supabase
      .from('project_lists')
      .select('id, area_id, sort_order, name')
      .eq('user_id', userId)
      .in('id', moves.map(m => m.id))

    if (fetchError) {
      return { success: false, error: `Failed to fetch project lists: ${fetchError.message}` }
    }

    if (!existingProjects || existingProjects.length !== moves.length) {
      return { success: false, error: 'Some project lists not found or access denied' }
    }

    // Validate parent_ids (area_ids) exist if specified
    const parentIds = moves.filter(m => m.parent_id).map(m => m.parent_id!)
    if (parentIds.length > 0) {
      const { data: parentAreas, error: parentError } = await supabase
        .from('areas')
        .select('id')
        .eq('user_id', userId)
        .in('id', parentIds)

      if (parentError) {
        return { success: false, error: `Failed to validate parent areas: ${parentError.message}` }
      }

      if (!parentAreas || parentAreas.length !== parentIds.length) {
        return { success: false, error: 'Some parent areas not found or access denied' }
      }
    }

    // Validate all moves
    for (const move of moves) {
      const validation = validateMoveOperation('project_lists', move, existingProjects)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }
    }

    // Perform batch update
    const updates = moves.map(move => ({
      id: move.id,
      sort_order: move.sort_order,
      area_id: move.parent_id,
      updated_at: new Date().toISOString(),
    }))

    const { error: updateError } = await supabase
      .from('project_lists')
      .upsert(updates, { onConflict: 'id' })

    if (updateError) {
      return { success: false, error: `Failed to update project lists: ${updateError.message}` }
    }

    return {
      success: true,
      affectedIds: moves.map(m => m.id)
    }
  } catch (error: unknown) {
    return handleDatabaseError(error, 'project list reordering')
  }
}

/**
 * Performs batch reordering of areas
 */
export async function reorderAreas(
  userId: string,
  moves: ReorderMoveInput[]
): Promise<ReorderResult> {
  try {
    const supabase = await createClient()

    // Fetch existing areas
    const { data: existingAreas, error: fetchError } = await supabase
      .from('areas')
      .select('id, sort_order, name')
      .eq('user_id', userId)
      .in('id', moves.map(m => m.id))

    if (fetchError) {
      return { success: false, error: `Failed to fetch areas: ${fetchError.message}` }
    }

    if (!existingAreas || existingAreas.length !== moves.length) {
      return { success: false, error: 'Some areas not found or access denied' }
    }

    // Validate all moves
    for (const move of moves) {
      const validation = validateMoveOperation('areas', move, existingAreas)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }
    }

    // Perform batch update
    const updates = moves.map(move => ({
      id: move.id,
      sort_order: move.sort_order,
      updated_at: new Date().toISOString(),
    }))

    const { error: updateError } = await supabase
      .from('areas')
      .upsert(updates, { onConflict: 'id' })

    if (updateError) {
      return { success: false, error: `Failed to update areas: ${updateError.message}` }
    }

    return {
      success: true,
      affectedIds: moves.map(m => m.id)
    }
  } catch (error: unknown) {
    return handleDatabaseError(error, 'area reordering')
  }
}

/**
 * Main reordering function that delegates to specific entity handlers
 */
export async function performReorder(
  userId: string,
  entityType: 'tasks' | 'project_lists' | 'areas',
  moves: ReorderMoveInput[]
): Promise<ReorderResult> {
  switch (entityType) {
    case 'tasks':
      return reorderTasks(userId, moves)
    case 'project_lists':
      return reorderProjectLists(userId, moves)
    case 'areas':
      return reorderAreas(userId, moves)
    default:
      return { success: false, error: 'Invalid entity type' }
  }
}
