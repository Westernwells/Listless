import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/context'
import { taskCountService, TaskCountsByView, ProjectTaskCount } from '@/lib/api/task-count-service'

/**
 * Query keys for task count cache management
 */
const taskCountQueryKeys = {
  counts: {
    all: ['task-counts'] as const,
    views: () => [...taskCountQueryKeys.counts.all, 'views'] as const,
    view: (view: string) => [...taskCountQueryKeys.counts.views(), view] as const,
    projects: () => [...taskCountQueryKeys.counts.all, 'projects'] as const,
    project: (projectId: string) => [...taskCountQueryKeys.counts.projects(), projectId] as const,
    allViews: () => [...taskCountQueryKeys.counts.views(), 'all'] as const,
    allProjects: () => [...taskCountQueryKeys.counts.projects(), 'all'] as const,
  },
} as const

/**
 * Hook for fetching inbox task count
 */
export function useInboxTaskCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: taskCountQueryKeys.counts.view('inbox'),
    queryFn: async () => {
      const result = await taskCountService.getViewTaskCount('inbox')
      if (result.error) {
        throw new Error(result.error)
      }
      return result.count
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    enabled: !!user, // Only run query if user is authenticated
  })
}

/**
 * Hook for fetching today task count
 */
export function useTodayTaskCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: taskCountQueryKeys.counts.view('today'),
    queryFn: async () => {
      const result = await taskCountService.getViewTaskCount('today')
      if (result.error) {
        throw new Error(result.error)
      }
      return result.count
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!user, // Only run query if user is authenticated
  })
}

/**
 * Hook for fetching scheduled task count (future due dates)
 */
export function useScheduledTaskCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: taskCountQueryKeys.counts.view('scheduled'),
    queryFn: async () => {
      const result = await taskCountService.getViewTaskCount('scheduled')
      if (result.error) {
        throw new Error(result.error)
      }
      return result.count
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!user, // Only run query if user is authenticated
  })
}

/**
 * Hook for fetching deferred task count
 */
export function useDeferredTaskCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: taskCountQueryKeys.counts.view('deferred'),
    queryFn: async () => {
      const result = await taskCountService.getViewTaskCount('deferred')
      if (result.error) {
        throw new Error(result.error)
      }
      return result.count
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!user, // Only run query if user is authenticated
  })
}

/**
 * Hook for fetching completed task count
 */
export function useCompletedTaskCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: taskCountQueryKeys.counts.view('completed'),
    queryFn: async () => {
      const result = await taskCountService.getViewTaskCount('completed')
      if (result.error) {
        throw new Error(result.error)
      }
      return result.count
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!user, // Only run query if user is authenticated
  })
}

/**
 * Hook for fetching task count for a specific project
 */
export function useProjectTaskCount(projectId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: taskCountQueryKeys.counts.project(projectId),
    queryFn: async () => {
      const result = await taskCountService.getProjectTaskCount(projectId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.count
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!user && !!projectId, // Only run query if user is authenticated and projectId is provided
  })
}

/**
 * Hook for fetching all view task counts in a single request
 * More efficient than individual hooks when you need multiple counts
 */
export function useAllViewTaskCounts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: taskCountQueryKeys.counts.allViews(),
    queryFn: async (): Promise<TaskCountsByView> => {
      const result = await taskCountService.getAllViewTaskCounts()
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to fetch task counts')
      }
      return result.data
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!user, // Only run query if user is authenticated
  })
}

/**
 * Hook for fetching all project task counts
 */
export function useAllProjectTaskCounts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: taskCountQueryKeys.counts.allProjects(),
    queryFn: async (): Promise<ProjectTaskCount[]> => {
      const result = await taskCountService.getAllProjectTaskCounts()
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to fetch project task counts')
      }
      return result.data
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!user, // Only run query if user is authenticated
  })
}

/**
 * Hook for fetching trash task count
 */
export function useTrashTaskCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: taskCountQueryKeys.counts.view('trash'),
    queryFn: async () => {
      // Use the permanent delete endpoint to get trash count
      const response = await fetch('/api/tasks/permanent', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch trash count')
      }

      const result = await response.json()
      return result.data?.trashed_count || 0
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    enabled: !!user, // Only run query if user is authenticated
  })
}

/**
 * Export query keys for cache invalidation in mutations
 */
export { taskCountQueryKeys }
