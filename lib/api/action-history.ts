import { createClient } from '@/lib/supabase/server'
import { ActionHistoryEntry } from './validation'
import { v4 as uuidv4 } from 'uuid'

/**
 * Records an action in the action history table for undo/redo functionality
 * This enables users to undo and redo their actions across the application
 */
export async function recordAction({
  userId,
  actionType,
  entityType,
  entityId,
  oldData,
  newData,
  metadata,
}: {
  userId: string
  actionType: ActionHistoryEntry['action_type']
  entityType: ActionHistoryEntry['entity_type']
  entityId: string
  oldData?: Record<string, any>
  newData?: Record<string, any>
  metadata?: Record<string, any>
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('action_history').insert({
      id: uuidv4(),
      user_id: userId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      old_data: oldData || null,
      new_data: newData || null,
      metadata: metadata || null,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error recording action history:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error recording action history:', error)
    return { success: false, error: 'Failed to record action history' }
  }
}

/**
 * Records a task creation action
 */
export async function recordTaskCreation(
  userId: string,
  taskId: string,
  taskData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'create',
    entityType: 'task',
    entityId: taskId,
    newData: taskData,
    metadata,
  })
}

/**
 * Records a task update action
 */
export async function recordTaskUpdate(
  userId: string,
  taskId: string,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'update',
    entityType: 'task',
    entityId: taskId,
    oldData,
    newData,
    metadata,
  })
}

/**
 * Records a task deletion action
 */
export async function recordTaskDeletion(
  userId: string,
  taskId: string,
  taskData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'delete',
    entityType: 'task',
    entityId: taskId,
    oldData: taskData,
    metadata,
  })
}

/**
 * Records a task restoration action
 */
export async function recordTaskRestoration(
  userId: string,
  taskId: string,
  taskData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'restore',
    entityType: 'task',
    entityId: taskId,
    newData: taskData,
    metadata,
  })
}

/**
 * Records a task duplication action
 */
export async function recordTaskDuplication(
  userId: string,
  originalTaskId: string,
  newTaskId: string,
  taskData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'duplicate',
    entityType: 'task',
    entityId: newTaskId,
    newData: taskData,
    metadata: {
      ...metadata,
      original_task_id: originalTaskId,
    },
  })
}

/**
 * Records a task to project conversion action
 */
export async function recordTaskConversion(
  userId: string,
  taskId: string,
  projectId: string,
  taskData: Record<string, any>,
  projectData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'convert',
    entityType: 'task',
    entityId: taskId,
    oldData: taskData,
    newData: projectData,
    metadata: {
      ...metadata,
      new_project_id: projectId,
      conversion_type: 'task_to_project',
    },
  })
}

/**
 * Records a project list creation action
 */
export async function recordProjectListCreation(
  userId: string,
  projectListId: string,
  projectListData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'create',
    entityType: 'project_list',
    entityId: projectListId,
    newData: projectListData,
    metadata,
  })
}

/**
 * Records a project list update action
 */
export async function recordProjectListUpdate(
  userId: string,
  projectListId: string,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'update',
    entityType: 'project_list',
    entityId: projectListId,
    oldData,
    newData,
    metadata,
  })
}

/**
 * Records a project list deletion action
 */
export async function recordProjectListDeletion(
  userId: string,
  projectListId: string,
  projectListData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'delete',
    entityType: 'project_list',
    entityId: projectListId,
    oldData: projectListData,
    metadata,
  })
}

/**
 * Records an area creation action
 */
export async function recordAreaCreation(
  userId: string,
  areaId: string,
  areaData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'create',
    entityType: 'area',
    entityId: areaId,
    newData: areaData,
    metadata,
  })
}

/**
 * Records an area update action
 */
export async function recordAreaUpdate(
  userId: string,
  areaId: string,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'update',
    entityType: 'area',
    entityId: areaId,
    oldData,
    newData,
    metadata,
  })
}

/**
 * Records an area deletion action
 */
export async function recordAreaDeletion(
  userId: string,
  areaId: string,
  areaData: Record<string, any>,
  metadata?: Record<string, any>
) {
  return recordAction({
    userId,
    actionType: 'delete',
    entityType: 'area',
    entityId: areaId,
    oldData: areaData,
    metadata,
  })
}

/**
 * Cleans up old action history entries to prevent database bloat
 * Keeps the last 1000 actions per user by default
 */
export async function cleanupActionHistory(
  userId: string,
  keepCount: number = 1000
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const supabase = await createClient()

    // Get the cutoff timestamp for actions to keep
    const { data: cutoffData, error: cutoffError } = await supabase
      .from('action_history')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .range(keepCount - 1, keepCount - 1)

    if (cutoffError) {
      return { success: false, error: cutoffError.message }
    }

    // If we don't have enough actions to clean up, return early
    if (!cutoffData || cutoffData.length === 0) {
      return { success: true, deletedCount: 0 }
    }

    const cutoffTimestamp = cutoffData[0].created_at

    // Delete old actions
    const { count, error: deleteError } = await supabase
      .from('action_history')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
      .lt('created_at', cutoffTimestamp)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true, deletedCount: count || 0 }
  } catch (error) {
    console.error('Error cleaning up action history:', error)
    return { success: false, error: 'Failed to cleanup action history' }
  }
}
