/**
 * TanStack Query hooks for tag management
 * Provides optimistic updates, caching, and error handling for tag operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { tagService, type FrontendTag } from '@/lib/api/tag-service'

// Query keys for tags
export const tagQueryKeys = {
  all: ['tags'] as const,
  lists: () => [...tagQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...tagQueryKeys.lists(), { filters }] as const,
  details: () => [...tagQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagQueryKeys.details(), id] as const,
  taskTags: (taskId: string) => [...tagQueryKeys.all, 'task', taskId] as const,
}

/**
 * Hook for fetching all tags
 */
export function useTags() {
  return useQuery({
    queryKey: tagQueryKeys.list({}),
    queryFn: async () => {
      const result = await tagService.getAllTags()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for fetching tags for a specific task
 */
export function useTaskTags(taskId: string) {
  return useQuery({
    queryKey: tagQueryKeys.taskTags(taskId),
    queryFn: async () => {
      const result = await tagService.getTaskTags(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for fetching usage count for a specific tag
 */
export function useTagUsageCount(tagId: string) {
  return useQuery({
    queryKey: [...tagQueryKeys.detail(tagId), 'usage-count'],
    queryFn: async () => {
      const result = await tagService.getTagUsageCount(tagId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: !!tagId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for fetching usage counts for multiple tags
 */
export function useTagsWithUsageCounts(tags: FrontendTag[]) {
  return useQuery({
    queryKey: [...tagQueryKeys.all, 'usage-counts', tags.map(t => t.id).sort()],
    queryFn: async () => {
      const results = await Promise.allSettled(
        tags.map(async (tag) => {
          const result = await tagService.getTagUsageCount(tag.id)
          return {
            tagId: tag.id,
            usageCount: result.data?.usage_count || 0,
            error: result.error
          }
        })
      )

      const usageCounts: Record<string, number> = {}
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          usageCounts[tags[index].id] = result.value.usageCount
        } else {
          usageCounts[tags[index].id] = 0
        }
      })

      return usageCounts
    },
    enabled: tags.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for creating tags with optimistic updates
 */
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tagData: Partial<FrontendTag>) => {
      const result = await tagService.createTag(tagData)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onMutate: async (newTag) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: tagQueryKeys.lists() })

      // Snapshot the previous value
      const previousTags = queryClient.getQueryData(tagQueryKeys.list({}))

      // Optimistically update to the new value
      const optimisticTag: FrontendTag = {
        id: `temp-${Date.now()}`,
        name: newTag.name || 'New Tag',
        color: newTag.color || '#6366f1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData(
        tagQueryKeys.list({}),
        (old: FrontendTag[] | undefined) => {
          if (!old) return [optimisticTag]
          return [...old, optimisticTag]
        }
      )

      return { previousTags, optimisticTag }
    },
    onError: (err, newTag, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTags) {
        queryClient.setQueryData(tagQueryKeys.list({}), context.previousTags)
      }

      toast({
        title: 'Error',
        description: 'Failed to create tag. Please try again.',
        variant: 'destructive',
      })
    },
    onSuccess: (data, variables, context) => {
      // Replace the optimistic tag with the real one
      if (!context?.optimisticTag) return

      queryClient.setQueryData(
        tagQueryKeys.list({}),
        (old: FrontendTag[] | undefined) => {
          if (!old) return [data]
          return old.map(tag =>
            tag.id === context.optimisticTag.id ? data : tag
          )
        }
      )

      toast({
        title: 'Success',
        description: 'Tag created successfully!',
      })
    },
  })
}

/**
 * Hook for deleting tags with optimistic updates
 */
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tagId: string) => {
      const result = await tagService.deleteTag(tagId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete tag')
      }
      return tagId
    },
    onMutate: async (tagId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: tagQueryKeys.lists() })

      // Snapshot the previous value
      const previousTags = queryClient.getQueryData(tagQueryKeys.list({}))

      // Optimistically update to the new value
      queryClient.setQueryData(
        tagQueryKeys.list({}),
        (old: FrontendTag[] | undefined) => {
          if (!old) return old
          return old.filter(tag => tag.id !== tagId)
        }
      )

      return { previousTags }
    },
    onError: (err, tagId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTags) {
        queryClient.setQueryData(tagQueryKeys.list({}), context.previousTags)
      }

      toast({
        title: 'Error',
        description: 'Failed to delete tag. Please try again.',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      // Invalidate task queries to ensure tag removal is reflected in tasks
      queryClient.invalidateQueries({ queryKey: ['tasks'] })

      toast({
        title: 'Success',
        description: 'Tag deleted successfully!',
      })
    },
  })
}

/**
 * Hook for adding tags to tasks with optimistic updates
 */
export function useAddTagToTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      taskId, 
      tagId, 
      options 
    }: { 
      taskId: string; 
      tagId: string; 
      options?: { isAiSuggested?: boolean; confidenceScore?: number } 
    }) => {
      const result = await tagService.addTagToTask(taskId, tagId, options)
      if (!result.success) {
        throw new Error(result.error || 'Failed to add tag to task')
      }
      return { taskId, tagId }
    },
    onSuccess: ({ taskId }) => {
      // Invalidate task queries to ensure the new tag is reflected
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.taskTags(taskId) })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add tag to task. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook for removing tags from tasks with optimistic updates
 */
export function useRemoveTagFromTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, tagId }: { taskId: string; tagId: string }) => {
      const result = await tagService.removeTagFromTask(taskId, tagId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove tag from task')
      }
      return { taskId, tagId }
    },
    onSuccess: ({ taskId }) => {
      // Invalidate task queries to ensure the tag removal is reflected
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.taskTags(taskId) })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove tag from task. Please try again.',
        variant: 'destructive',
      })
    },
  })
}
