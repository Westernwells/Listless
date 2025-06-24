'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
  initialUser?: User | null
  initialSession?: Session | null
}

export function AuthProvider({ 
  children, 
  initialUser = null, 
  initialSession = null 
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [loading, setLoading] = useState(!initialUser)

  const supabase = createClient()

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error refreshing user:', error)
        return
      }

      setUser(currentUser)

      if (currentUser) {
        const profile = await fetchUserProfile(currentUser.id)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const signOut = async () => {
    try {
      // Don't set loading during logout to avoid UI flicker
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Error signing out:', error)
        throw error
      }

      // Clear auth state immediately
      setUser(null)
      setUserProfile(null)
      setSession(null)
    } catch (error) {
      console.error('Error in signOut:', error)
      throw error
    }
  }

  useEffect(() => {
    // Get initial session if not provided
    if (!initialSession && !initialUser) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          fetchUserProfile(session.user.id).then(setUserProfile)
        }
        
        setLoading(false)
      })
    } else if (initialUser) {
      // If we have an initial user, fetch their profile
      fetchUserProfile(initialUser.id).then(setUserProfile)
      setLoading(false)
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }

      setLoading(false)

      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserProfile(null)
        setSession(null)
      }

      if (event === 'SIGNED_IN') {
        // Refresh the page to ensure all server components are updated
        window.location.reload()
      }

      if (event === 'TOKEN_REFRESHED') {
        // Session was refreshed, user data should be current
        console.log('Token refreshed')
      }
    })

    return () => subscription.unsubscribe()
  }, [initialSession, initialUser, supabase.auth])

  const value = {
    user,
    userProfile,
    session,
    loading,
    signOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to check if user is authenticated
 */
export function useRequireAuth() {
  const { user, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth/login'
    }
  }, [user, loading])

  return { user, loading }
}

/**
 * Hook to redirect authenticated users
 */
export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  const { user, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && user) {
      window.location.href = redirectTo
    }
  }, [user, loading, redirectTo])

  return { user, loading }
}

/**
 * Higher-order component to protect routes
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useRequireAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    }

    if (!user) {
      return null // Will redirect in useRequireAuth
    }

    return <Component {...props} />
  }
}

/**
 * Higher-order component to redirect authenticated users
 */
export function withoutAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo = '/dashboard'
) {
  return function UnauthenticatedComponent(props: P) {
    const { user, loading } = useRedirectIfAuthenticated(redirectTo)

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    }

    if (user) {
      return null // Will redirect in useRedirectIfAuthenticated
    }

    return <Component {...props} />
  }
}
