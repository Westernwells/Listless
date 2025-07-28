import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService, Area, ProjectList } from '@/lib/api/project-service'
import { toast } from '@/hooks/use-toast'
import { taskCountQueryKeys } from '@/hooks/use-task-counts'

/**
 * Query keys for project and area cache management
 */
const projectQueryKeys = {
  projects: {
    all: ['projects'] as const,
    areas: () => [...projectQueryKeys.projects.all, 'areas'] as const,
    lists: () => [...projectQueryKeys.projects.all, 'lists'] as const,
    list: (filters: Record<string, any>) => [...projectQueryKeys.projects.lists(), filters] as const,
    standalone: () => [...projectQueryKeys.projects.lists(), 'standalone'] as const,
  },
} as const

/**
 * Hook for fetching all areas with their project lists
 */
export function useAreas() {
  return useQuery({
    queryKey: projectQueryKeys.projects.areas(),
    queryFn: async (): Promise<Area[]> => {
      const result = await projectService.getAreas()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
}

/**
 * Hook for fetching all project lists (optionally filtered by area)
 */
export function useProjectLists(areaId?: string) {
  return useQuery({
    queryKey: projectQueryKeys.projects.list({ area_id: areaId }),
    queryFn: async (): Promise<ProjectList[]> => {
      const result = await projectService.getProjectLists(areaId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!areaId, // Only run query if areaId is provided
  })
}

/**
 * Hook for fetching standalone project lists (not assigned to any area)
 */
export function useStandaloneProjectLists() {
  return useQuery({
    queryKey: projectQueryKeys.projects.standalone(),
    queryFn: async (): Promise<ProjectList[]> => {
      const result = await projectService.getStandaloneProjectLists()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for fetching all project lists regardless of area
 */
export function useAllProjectLists() {
  return useQuery({
    queryKey: projectQueryKeys.projects.list({}),
    queryFn: async (): Promise<ProjectList[]> => {
      const result = await projectService.getProjectLists()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for creating a new area
 */
export function useCreateArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (areaData: {
      name: string
      description?: string
      color?: string
      sort_order: number
    }) => {
      const result = await projectService.createArea(areaData)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: () => {
      // Invalidate areas cache to refetch data
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects.areas() })
      
      toast({
        title: 'Success',
        description: 'Area created successfully!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create area: ${error.message}`,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook for creating a new project list
 */
export function useCreateProjectList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectData: {
      name: string
      description?: string
      color?: string
      area_id?: string
      sort_order: number
    }) => {
      const result = await projectService.createProjectList(projectData)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (data) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects.lists() })
      if (data.area_id) {
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects.areas() })
      } else {
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects.standalone() })
      }
      
      // Invalidate project count caches since we have a new project
      queryClient.invalidateQueries({ queryKey: taskCountQueryKeys.counts.projects() })
      
      toast({
        title: 'Success',
        description: 'Project created successfully!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create project: ${error.message}`,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Export query keys for cache invalidation
 */
export { projectQueryKeys }
