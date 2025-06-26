import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService, FrontendTask } from '@/lib/api/task-service'
import { toast } from '@/hooks/use-toast'

/**
 * Query keys for consistent cache management
 */
const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
  },
} as const

// Task interface for UI components
export interface Task {
  id: string
  content: string
  checked: boolean
  dueDate?: string
  deferDate?: string
  flagged?: boolean
  priority?: string | null
  tags?: string[]
  notes?: string
  completedAt?: string
  isTrashed?: boolean
}

// Utility function to convert FrontendTask to Task interface
const mapFrontendTaskToTask = (frontendTask: FrontendTask): Task => ({
  id: frontendTask.id,
  content: frontendTask.content,
  checked: frontendTask.checked,
  dueDate: frontendTask.dueDate,
  flagged: frontendTask.flagged,
  tags: frontendTask.tags,
  priority: frontendTask.priority,
  notes: frontendTask.description,
})

/**
 * Hook for fetching tasks with TanStack Query
 */
export function useTasks(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters || {}),
    queryFn: async (): Promise<Task[]> => {
      const result = await taskService.getTasks(filters)
      if (result.error) {
        throw new Error(result.error)
      }
      // Map FrontendTask[] to Task[] for UI components
      return (result.data || []).map(mapFrontendTaskToTask)
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds for real-time feel
  })
}

/**
 * Hook for fetching inbox tasks (unscheduled, unassigned to projects, not deferred)
 */
export function useInboxTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.list({ view: 'inbox' }),
    queryFn: async (): Promise<Task[]> => {
      const result = await taskService.getTasks({ view: 'inbox' })
      if (result.error) {
        throw new Error(result.error)
      }
      return (result.data || []).map(mapFrontendTaskToTask)
    },
    staleTime: 30 * 1000,
  })
}

/**
 * Hook for fetching today's tasks (scheduled for today)
 */
export function useTodayTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.list({ view: 'today' }),
    queryFn: async (): Promise<Task[]> => {
      const result = await taskService.getTasks({ view: 'today' })
      if (result.error) {
        throw new Error(result.error)
      }
      return (result.data || []).map(mapFrontendTaskToTask)
    },
    staleTime: 30 * 1000,
  })
}

/**
 * Hook for fetching deferred tasks
 */
export function useDeferredTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.list({ view: 'deferred' }),
    queryFn: async (): Promise<Task[]> => {
      const result = await taskService.getTasks({ view: 'deferred' })
      if (result.error) {
        throw new Error(result.error)
      }
      return (result.data || []).map(mapFrontendTaskToTask)
    },
    staleTime: 30 * 1000,
  })
}

/**
 * Hook for fetching tasks for a specific project
 */
export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.list({ view: 'project', project_list_id: projectId }),
    queryFn: async (): Promise<Task[]> => {
      const result = await taskService.getTasks({
        view: 'project',
        project_list_id: projectId
      })
      if (result.error) {
        throw new Error(result.error)
      }
      return (result.data || []).map(mapFrontendTaskToTask)
    },
    staleTime: 30 * 1000,
  })
}

/**
 * Hook for fetching completed tasks specifically
 */
export function useCompletedTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.list({ view: 'completed' }),
    queryFn: async (): Promise<Task[]> => {
      const result = await taskService.getTasks({ view: 'completed' })
      if (result.error) {
        throw new Error(result.error)
      }
      // Map FrontendTask[] to Task[] for UI components
      return (result.data || []).map(mapFrontendTaskToTask)
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds for real-time feel
  })
}

/**
 * Hook for creating tasks with optimistic updates
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskData: Partial<FrontendTask> & { tempId?: string }) => {
      const result = await taskService.createTask(taskData)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches for all task queries
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })

      // Snapshot the previous values for all relevant queries
      const previousAllTasks = queryClient.getQueryData(queryKeys.tasks.list({}))
      const previousInboxTasks = queryClient.getQueryData(queryKeys.tasks.list({ view: 'inbox' }))
      const previousTodayTasks = queryClient.getQueryData(queryKeys.tasks.list({ view: 'today' }))
      const previousDeferredTasks = queryClient.getQueryData(queryKeys.tasks.list({ view: 'deferred' }))
      const previousProjectTasks = newTask.project_list_id
        ? queryClient.getQueryData(queryKeys.tasks.list({ view: 'project', project_list_id: newTask.project_list_id }))
        : null

      // Use provided tempId or create a unique one
      const uniqueId = newTask.tempId || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Optimistically update to the new value
      const optimisticTask: Task = {
        id: uniqueId,
        content: newTask.content || 'New Task',
        checked: newTask.checked || false,
        dueDate: newTask.dueDate,
        flagged: newTask.flagged || false,
        tags: newTask.tags || [],
        priority: newTask.priority || 'medium',
        notes: newTask.description,
      }

      // Update all relevant query caches
      queryClient.setQueryData(
        queryKeys.tasks.list({}),
        (old: Task[] | undefined) => {
          return old ? [...old, optimisticTask] : [optimisticTask]
        }
      )

      // Update view-specific caches based on task properties
      if (!newTask.project_list_id && !newTask.dueDate) {
        // Task belongs to inbox
        queryClient.setQueryData(
          queryKeys.tasks.list({ view: 'inbox' }),
          (old: Task[] | undefined) => {
            return old ? [...old, optimisticTask] : [optimisticTask]
          }
        )
      }

      if (newTask.dueDate) {
        // Check if due date is today
        const today = new Date().toISOString().split('T')[0]
        const taskDate = newTask.dueDate.split('T')[0]
        if (taskDate === today) {
          queryClient.setQueryData(
            queryKeys.tasks.list({ view: 'today' }),
            (old: Task[] | undefined) => {
              return old ? [...old, optimisticTask] : [optimisticTask]
            }
          )
        }
      }

      if (newTask.project_list_id) {
        // Task belongs to a project
        queryClient.setQueryData(
          queryKeys.tasks.list({ view: 'project', project_list_id: newTask.project_list_id }),
          (old: Task[] | undefined) => {
            return old ? [...old, optimisticTask] : [optimisticTask]
          }
        )
      }

      // Return a context object with the snapshotted values
      return {
        previousAllTasks,
        previousInboxTasks,
        previousTodayTasks,
        previousDeferredTasks,
        previousProjectTasks,
        optimisticTask,
        newTask
      }
    },
    onError: (err, newTask, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back all queries
      if (context) {
        if (context.previousAllTasks) {
          queryClient.setQueryData(queryKeys.tasks.list({}), context.previousAllTasks)
        }
        if (context.previousInboxTasks) {
          queryClient.setQueryData(queryKeys.tasks.list({ view: 'inbox' }), context.previousInboxTasks)
        }
        if (context.previousTodayTasks) {
          queryClient.setQueryData(queryKeys.tasks.list({ view: 'today' }), context.previousTodayTasks)
        }
        if (context.previousDeferredTasks) {
          queryClient.setQueryData(queryKeys.tasks.list({ view: 'deferred' }), context.previousDeferredTasks)
        }
        if (context.previousProjectTasks && context.newTask.project_list_id) {
          queryClient.setQueryData(
            queryKeys.tasks.list({ view: 'project', project_list_id: context.newTask.project_list_id }),
            context.previousProjectTasks
          )
        }
      }

      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      })
    },
    onSuccess: (data, variables, context) => {
      // Replace the optimistic task with the real one across all relevant caches
      const mappedTask = mapFrontendTaskToTask(data)

      if (!context?.optimisticTask) return

      // Update all tasks cache
      queryClient.setQueryData(
        queryKeys.tasks.list({}),
        (old: Task[] | undefined) => {
          if (!old) return old
          return old.map(task =>
            task.id === context.optimisticTask.id ? mappedTask : task
          )
        }
      )

      // Update view-specific caches based on task properties
      if (!variables.project_list_id && !variables.dueDate) {
        // Task belongs to inbox
        queryClient.setQueryData(
          queryKeys.tasks.list({ view: 'inbox' }),
          (old: Task[] | undefined) => {
            if (!old) return old
            return old.map(task =>
              task.id === context.optimisticTask.id ? mappedTask : task
            )
          }
        )
      }

      if (variables.dueDate) {
        // Check if due date is today
        const today = new Date().toISOString().split('T')[0]
        const taskDate = variables.dueDate.split('T')[0]
        if (taskDate === today) {
          queryClient.setQueryData(
            queryKeys.tasks.list({ view: 'today' }),
            (old: Task[] | undefined) => {
              if (!old) return old
              return old.map(task =>
                task.id === context.optimisticTask.id ? mappedTask : task
              )
            }
          )
        }
      }

      if (variables.project_list_id) {
        // Task belongs to a project
        queryClient.setQueryData(
          queryKeys.tasks.list({ view: 'project', project_list_id: variables.project_list_id }),
          (old: Task[] | undefined) => {
            if (!old) return old
            return old.map(task =>
              task.id === context.optimisticTask.id ? mappedTask : task
            )
          }
        )
      }

      toast({
        title: 'Success',
        description: 'Task created successfully!',
      })
    },
    // Remove onSettled to prevent unnecessary refetches - optimistic updates handle consistency
  })
}

/**
 * Hook for updating tasks with optimistic updates
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FrontendTask> }) => {
      const result = await taskService.updateTask(id, updates)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(queryKeys.tasks.list({}))

      // Optimistically update to the new value
      queryClient.setQueryData(
        queryKeys.tasks.list({}),
        (old: Task[] | undefined) => {
          if (!old) return old

          return old.map(task =>
            task.id === id ? { ...task, ...updates } : task
          )
        }
      )

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.list({}), context.previousTasks)
      }
      
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      })
    },
    // Remove onSettled to prevent unnecessary refetches - optimistic updates handle consistency
  })
}

/**
 * Hook for toggling task completion with optimistic updates
 */
export function useToggleTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const result = await taskService.toggleTask(id, completed)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onMutate: async ({ id, completed }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })

      // Snapshot all relevant cache entries
      const previousCaches = new Map()

      // Find the task data from any cache to use for cross-cache operations
      let taskData: Task | null = null

      // Get all task list cache entries
      const cacheEntries = queryClient.getQueriesData({ queryKey: queryKeys.tasks.lists() })
      cacheEntries.forEach(([queryKey, data]) => {
        previousCaches.set(queryKey, data)

        // Find the task data if we haven't found it yet
        if (!taskData && Array.isArray(data)) {
          taskData = data.find((task: Task) => task.id === id) || null
        }
      })

      // If we couldn't find the task in any cache, we can't proceed with optimistic update
      if (!taskData) {
        console.warn(`Task ${id} not found in any cache for optimistic update`)
        return { previousCaches }
      }

      // Optimistically update all cache entries
      cacheEntries.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          const queryKeyObj = queryKey[2] as Record<string, any> | undefined;
          const isCompletedTasksCache =
            typeof queryKeyObj === 'object' &&
            queryKeyObj !== null &&
            'view' in queryKeyObj &&
            queryKeyObj.view === "completed";

          queryClient.setQueryData(
            queryKey,
            (old: Task[] | undefined) => {
              if (!old) return old

              if (isCompletedTasksCache) {
                // For completed tasks cache
                if (completed) {
                  // Add task to completed cache if being completed
                  const taskExists = old.some(task => task.id === id)
                  const updatedTask = { ...taskData!, checked: true, completedAt: new Date().toISOString() }
                  return taskExists
                    ? old.map(task => task.id === id ? updatedTask : task)
                    : [...old, updatedTask]
                } else {
                  // Remove task from completed cache if being uncompleted
                  return old.filter(task => task.id !== id)
                }
              } else {
                // For main tasks cache (incomplete tasks)
                if (completed) {
                  // Remove task from main cache if being completed
                  return old.filter(task => task.id !== id)
                } else {
                  // Add task back to main cache if being uncompleted, or update if already there
                  const taskExists = old.some(task => task.id === id)
                  const updatedTask = { ...taskData!, checked: false, completedAt: undefined }
                  return taskExists
                    ? old.map(task => task.id === id ? updatedTask : task)
                    : [...old, updatedTask]
                }
              }
            }
          )
        }
      })

      return { previousCaches }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, restore all cache entries
      if (context?.previousCaches) {
        context.previousCaches.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      })
    },
    onSuccess: (data, variables, context) => {
      // Update cache with the real data from server
      const mappedTask = mapFrontendTaskToTask(data);

      // Update all relevant cache entries with the server response
      // Note: Removed queryClient.invalidateQueries to prevent excessive re-renders

      // Get all task list cache entries and update them with server data
      const cacheEntries = queryClient.getQueriesData({ queryKey: queryKeys.tasks.lists() })
      cacheEntries.forEach(([queryKey, cachedData]) => {
        if (Array.isArray(cachedData)) {
          const queryKeyObj = queryKey[2] as Record<string, any> | undefined;
          const isCompletedTasksCache =
            typeof queryKeyObj === 'object' &&
            queryKeyObj !== null &&
            'view' in queryKeyObj &&
            queryKeyObj.view === "completed";

          queryClient.setQueryData(
            queryKey,
            (old: Task[] | undefined) => {
              if (!old) return old

              if (isCompletedTasksCache) {
                // For completed tasks cache
                if (variables.completed) {
                  // Add or update task in completed cache
                  const exists = old.some(task => task.id === variables.id)
                  return exists
                    ? old.map(task => task.id === variables.id ? mappedTask : task)
                    : [...old, mappedTask]
                } else {
                  // Remove task from completed cache
                  return old.filter(task => task.id !== variables.id)
                }
              } else {
                // For main tasks cache (incomplete tasks)
                if (variables.completed) {
                  // Remove task from main cache
                  return old.filter(task => task.id !== variables.id)
                } else {
                  // Add or update task in main cache
                  const exists = old.some(task => task.id === variables.id)
                  return exists
                    ? old.map(task => task.id === variables.id ? mappedTask : task)
                    : [...old, mappedTask]
                }
              }
            }
          );
        }
      })
    },
    // Remove onSettled to prevent unnecessary refetches
  })
}

/**
 * Hook for deleting tasks with optimistic updates
 */
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const result = await taskService.deleteTask(taskId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete task')
      }
      return taskId
    },
    onMutate: async (taskId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(queryKeys.tasks.list({}))

      // Optimistically remove the task
      queryClient.setQueryData(
        queryKeys.tasks.list({}),
        (old: Task[] | undefined) => {
          if (!old) return old
          return old.filter(task => task.id !== taskId)
        }
      )

      return { previousTasks }
    },
    onError: (err, taskId, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.list({}), context.previousTasks)
      }

      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive',
      })
    },
    // Remove onSettled to prevent unnecessary refetches - optimistic updates handle consistency
  })
}
