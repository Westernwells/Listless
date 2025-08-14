import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, type UserProfile } from '@/lib/api/user-service'
import { toast } from '@/hooks/use-toast'

export const userQueryKeys = {
  profile: ['user', 'profile'] as const,
}

export function useUserProfile() {
  return useQuery({
    queryKey: userQueryKeys.profile,
    queryFn: async (): Promise<UserProfile> => {
      const res = await userService.getProfile()
      if (res.error || !res.data) {
        throw new Error(res.error || 'Failed to load profile')
      }
      return res.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<Pick<UserProfile, 'name' | 'bio' | 'avatar_url'>>) => {
      const res = await userService.updateProfile(updates)
      if (res.error || !res.data) {
        throw new Error(res.error || 'Failed to update profile')
      }
      return res.data
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(userQueryKeys.profile, data)
      toast({ title: 'Profile updated', description: 'Your profile information has been saved.' })
    },
    onError: (err: any) => {
      toast({ title: 'Failed to save profile', description: err.message || 'Please try again.', variant: 'destructive' })
    },
  })
}

