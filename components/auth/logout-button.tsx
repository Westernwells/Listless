'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { useAuth } from '@/lib/auth/context'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default', 
  className,
  children 
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      await signOut()
      // Force immediate redirect after successful logout
      window.location.replace('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      {children || 'Sign out'}
    </Button>
  )
}

/**
 * Simple logout button with just an icon
 */
export function LogoutIconButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      await signOut()
      window.location.replace('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleSignOut}
      disabled={isLoading}
      title="Sign out"
    >
      {isLoading ? (
        <Icons.spinner className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
    </Button>
  )
}
