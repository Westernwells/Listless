'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth/context'
import { LogoutButton } from './logout-button'
import { User, Settings, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export function UserProfile() {
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/signup">Sign up</Link>
        </Button>
      </div>
    )
  }

  const displayName = userProfile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={userProfile?.avatar_url || user.user_metadata?.avatar_url} 
              alt={displayName} 
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/account" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/help" className="cursor-pointer">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <LogoutButton variant="ghost" className="w-full justify-start p-0 h-auto font-normal">
            Sign out
          </LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Compact user profile for smaller spaces
 */
export function UserProfileCompact() {
  const { user, userProfile, loading } = useAuth()

  if (loading || !user) {
    return null
  }

  const displayName = userProfile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center space-x-2">
      <Avatar className="h-6 w-6">
        <AvatarImage 
          src={userProfile?.avatar_url || user.user_metadata?.avatar_url} 
          alt={displayName} 
        />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{displayName}</span>
    </div>
  )
}

/**
 * User avatar only
 */
export function UserAvatar({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const { user, userProfile, loading } = useAuth()

  if (loading || !user) {
    return null
  }

  const displayName = userProfile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizeClasses = {
    sm: 'h-6 w-6',
    default: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage 
        src={userProfile?.avatar_url || user.user_metadata?.avatar_url} 
        alt={displayName} 
      />
      <AvatarFallback className={size === 'sm' ? 'text-xs' : undefined}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
