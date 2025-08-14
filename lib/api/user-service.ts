/**
 * User API Service
 * Fetches and updates the authenticated user's profile
 */

export interface UserProfile {
  id: string
  name: string | null
  avatar_url: string | null
  bio: string | null
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export class UserService {
  async getProfile(): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { data: null, error: err.message || 'Failed to load profile' }
      }
      const result = await res.json()
      return { data: result.data as UserProfile, error: null }
    } catch (e) {
      console.error('getProfile error:', e)
      return { data: null, error: 'Network error while loading profile' }
    }
  }

  async updateProfile(updates: Partial<Pick<UserProfile, 'name' | 'bio' | 'avatar_url'>>): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { data: null, error: err.message || 'Failed to update profile' }
      }
      const result = await res.json()
      return { data: result.data as UserProfile, error: null }
    } catch (e) {
      console.error('updateProfile error:', e)
      return { data: null, error: 'Network error while updating profile' }
    }
  }
}

export const userService = new UserService()

