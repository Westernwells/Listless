/**
 * Project and Area API Service
 * Handles all project and area-related API operations
 */

import { createClient } from '@/lib/supabase/client'

export interface Area {
  id: string
  name: string
  description?: string
  color?: string
  user_id: string
  sort_order: number
  is_archived: boolean
  created_at: string
  updated_at: string
  project_lists?: ProjectList[]
}

export interface ProjectList {
  id: string
  name: string
  description?: string
  color?: string
  area_id?: string
  user_id: string
  sort_order: number
  is_archived: boolean
  is_template: boolean
  created_at: string
  updated_at: string
}

/**
 * Project and Area Service Class
 */
export class ProjectService {
  private supabase = createClient()

  /**
   * Get all areas with their project lists
   */
  async getAreas(): Promise<{ data: Area[] | null; error: string | null }> {
    try {
      const response = await fetch('/api/areas', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to fetch areas' }
      }

      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error) {
      console.error('Error fetching areas:', error)
      return { data: null, error: 'Network error while fetching areas' }
    }
  }

  /**
   * Get all project lists (optionally filtered by area)
   */
  async getProjectLists(areaId?: string): Promise<{ data: ProjectList[] | null; error: string | null }> {
    try {
      const params = new URLSearchParams()
      if (areaId) {
        params.append('area_id', areaId)
      }

      const url = `/api/project_lists${params.toString() ? '?' + params.toString() : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to fetch project lists' }
      }

      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error) {
      console.error('Error fetching project lists:', error)
      return { data: null, error: 'Network error while fetching project lists' }
    }
  }

  /**
   * Get standalone project lists (not assigned to any area)
   */
  async getStandaloneProjectLists(): Promise<{ data: ProjectList[] | null; error: string | null }> {
    try {
      const params = new URLSearchParams()
      params.append('standalone', 'true')

      const response = await fetch(`/api/project_lists?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to fetch standalone project lists' }
      }

      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error) {
      console.error('Error fetching standalone project lists:', error)
      return { data: null, error: 'Network error while fetching standalone project lists' }
    }
  }

  /**
   * Create a new area
   */
  async createArea(areaData: {
    name: string
    description?: string
    color?: string
    sort_order: number
  }): Promise<{ data: Area | null; error: string | null }> {
    try {
      const response = await fetch('/api/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(areaData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to create area' }
      }

      const result = await response.json()
      return { data: result.data, error: null }
    } catch (error) {
      console.error('Error creating area:', error)
      return { data: null, error: 'Network error while creating area' }
    }
  }

  /**
   * Create a new project list
   */
  async createProjectList(projectData: {
    name: string
    description?: string
    color?: string
    area_id?: string
    sort_order: number
  }): Promise<{ data: ProjectList | null; error: string | null }> {
    try {
      const response = await fetch('/api/project_lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || 'Failed to create project list' }
      }

      const result = await response.json()
      return { data: result.data, error: null }
    } catch (error) {
      console.error('Error creating project list:', error)
      return { data: null, error: 'Network error while creating project list' }
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService()
