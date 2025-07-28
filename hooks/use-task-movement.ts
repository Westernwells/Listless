import { useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService } from '@/lib/api/task-service'
import { toast } from '@/hooks/use-toast'
import { taskCountQueryKeys } from '@/hooks/use-task-counts'

/**
 * Query keys for task management
 */
const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.tasks.lists(), filters] as const,
  },
} as const

/**
 * Interface for task movement operations
 */
export interface TaskMovementData {
  taskId: string
  targetView: string
  projectId?: string
}

/**
 * Determines the task property updates needed based on target view
 */
function getTaskUpdatesForView(targetView: string, projectId?: string): Record<string, any> {
  const updates: Record<string, any> = {}

  switch (targetView.toLowerCase()) {
    case 'inbox':
      // Clear all assignments to move to inbox
      updates.due_date = null
      updates.project_list_id = null
      updates.is_deferred = false
      break

    case 'today':
      // Set due date to today
      updates.due_date = new Date().toISOString().split('T')[0]
      updates.is_deferred = false
      break

    case 'scheduled':
      // Keep existing due_date if it exists, otherwise prompt user
      // For now, we'll keep the existing due_date or set to tomorrow if none exists
      if (!updates.due_date) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        updates.due_date = tomorrow.toISOString().split('T')[0]
      }
      updates.is_deferred = false
      break

    case 'deferred':
      // Mark as deferred
      updates.is_deferred = true
      updates.due_date = null
      break

    default:
      // Handle project assignments
      if (projectId) {
        updates.project_list_id = projectId
        updates.is_deferred = false
      }
      break
  }

  return updates
}

/**
 * Hook for moving tasks between views with optimistic updates
 */
export function useTaskMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, targetView, projectId }: TaskMovementData) => {
      const updates = getTaskUpdatesForView(targetView, projectId)
      
      const result = await taskService.updateTask(taskId, updates)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },

    onMutate: async ({ taskId, targetView, projectId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })

      // Snapshot the previous values
      const previousAllTasks = queryClient.getQueryData(queryKeys.tasks.list({}))
      const previousInboxTasks = queryClient.getQueryData(queryKeys.tasks.list({ view: 'inbox' }))
      const previousTodayTasks = queryClient.getQueryData(queryKeys.tasks.list({ view: 'today' }))
      const previousScheduledTasks = queryClient.getQueryData(queryKeys.tasks.list({ view: 'scheduled' }))
      const previousDeferredTasks = queryClient.getQueryData(queryKeys.tasks.list({ view: 'deferred' }))
      const previousCompletedTasks = queryClient.getQueryData(queryKeys.tasks.list({ view: 'completed' }))
      const previousProjectTasks = projectId ? 
        queryClient.getQueryData(queryKeys.tasks.list({ view: 'project', project_list_id: projectId })) : null

      // Get the task updates
      const updates = getTaskUpdatesForView(targetView, projectId)

      // Helper function to update task in cache
      const updateTaskInCache = (queryKey: any[], updater: (task: any) => any) => {
        queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
          if (!old) return old
          return old.map(task => task.id === taskId ? updater(task) : task)
        })
      }

      // Helper function to remove task from cache
      const removeTaskFromCache = (queryKey: any[]) => {
        queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
          if (!old) return old
          return old.filter(task => task.id !== taskId)
        })
      }

      // Helper function to add task to cache
      const addTaskToCache = (queryKey: any[], updatedTask: any) => {
        queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
          if (!old) return [updatedTask]
          // Check if task already exists to avoid duplicates
          const exists = old.some(task => task.id === taskId)
          if (exists) {
            return old.map(task => task.id === taskId ? updatedTask : task)
          }
          return [...old, updatedTask]
        })
      }

      // Update all tasks cache
      updateTaskInCache(queryKeys.tasks.list({}), (task) => ({ ...task, ...updates }))

      // Remove task from all view caches first
      removeTaskFromCache(queryKeys.tasks.list({ view: 'inbox' }))
      removeTaskFromCache(queryKeys.tasks.list({ view: 'today' }))
      removeTaskFromCache(queryKeys.tasks.list({ view: 'scheduled' }))
      removeTaskFromCache(queryKeys.tasks.list({ view: 'deferred' }))
      if (projectId) {
        removeTaskFromCache(queryKeys.tasks.list({ view: 'project', project_list_id: projectId }))
      }

      // Find the task to get its current data
      const allTasks = queryClient.getQueryData(queryKeys.tasks.list({})) as any[] | undefined
      const currentTask = allTasks?.find(task => task.id === taskId)
      
      if (currentTask) {
        const updatedTask = { ...currentTask, ...updates }

        // Add task to appropriate target view cache
        switch (targetView.toLowerCase()) {
          case 'inbox':
            addTaskToCache(queryKeys.tasks.list({ view: 'inbox' }), updatedTask)
            break
          case 'today':
            addTaskToCache(queryKeys.tasks.list({ view: 'today' }), updatedTask)
            break
          case 'scheduled':
            addTaskToCache(queryKeys.tasks.list({ view: 'scheduled' }), updatedTask)
            break
          case 'deferred':
            addTaskToCache(queryKeys.tasks.list({ view: 'deferred' }), updatedTask)
            break
          default:
            if (projectId) {
              addTaskToCache(queryKeys.tasks.list({ view: 'project', project_list_id: projectId }), updatedTask)
            }
            break
        }
      }

      // Return context for rollback
      return {
        previousAllTasks,
        previousInboxTasks,
        previousTodayTasks,
        previousScheduledTasks,
        previousDeferredTasks,
        previousCompletedTasks,
        previousProjectTasks,
        taskId,
        targetView,
        projectId,
      }
    },

    onError: (err, variables, context) => {
      // Rollback optimistic updates
      if (context) {
        queryClient.setQueryData(queryKeys.tasks.list({}), context.previousAllTasks)
        queryClient.setQueryData(queryKeys.tasks.list({ view: 'inbox' }), context.previousInboxTasks)
        queryClient.setQueryData(queryKeys.tasks.list({ view: 'today' }), context.previousTodayTasks)
        queryClient.setQueryData(queryKeys.tasks.list({ view: 'scheduled' }), context.previousScheduledTasks)
        queryClient.setQueryData(queryKeys.tasks.list({ view: 'deferred' }), context.previousDeferredTasks)
        queryClient.setQueryData(queryKeys.tasks.list({ view: 'completed' }), context.previousCompletedTasks)
        if (context.projectId && context.previousProjectTasks) {
          queryClient.setQueryData(
            queryKeys.tasks.list({ view: 'project', project_list_id: context.projectId }), 
            context.previousProjectTasks
          )
        }
      }

      toast({
        title: 'Error',
        description: `Failed to move task to ${variables.targetView}: ${err.message}`,
        variant: 'destructive',
      })
    },

    onSuccess: (data, variables) => {
      // Invalidate count caches to ensure counters update
      queryClient.invalidateQueries({ queryKey: taskCountQueryKeys.counts.all })

      toast({
        title: 'Success',
        description: `Task moved to ${variables.targetView} successfully!`,
      })
    },
  })
}

/**
 * Hook for moving multiple tasks between views
 */
export function useBulkTaskMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (movements: TaskMovementData[]) => {
      const results = await Promise.all(
        movements.map(async ({ taskId, targetView, projectId }) => {
          const updates = getTaskUpdatesForView(targetView, projectId)
          const result = await taskService.updateTask(taskId, updates)
          if (result.error) {
            throw new Error(`Failed to move task ${taskId}: ${result.error}`)
          }
          return result.data
        })
      )
      return results
    },

    onSuccess: (data, variables) => {
      // Invalidate all task-related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      queryClient.invalidateQueries({ queryKey: taskCountQueryKeys.counts.all })

      toast({
        title: 'Success',
        description: `${variables.length} task(s) moved successfully!`,
      })
    },

    onError: (err) => {
      // Invalidate all queries to refresh from server
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      queryClient.invalidateQueries({ queryKey: taskCountQueryKeys.counts.all })

      toast({
        title: 'Error',
        description: `Failed to move tasks: ${err.message}`,
        variant: 'destructive',
      })
    },
  })
}
