import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback route handler
 * Handles email confirmations, password resets, and other auth callbacks
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        
        // Handle different types of errors
        if (error.message.includes('expired')) {
          return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent('The verification link has expired. Please request a new one.')}`
          )
        }
        
        if (error.message.includes('invalid')) {
          return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent('Invalid verification link. Please try again.')}`
          )
        }
        
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
        )
      }

      // Handle different callback types
      switch (type) {
        case 'recovery':
          // Password reset - redirect to update password page
          return NextResponse.redirect(`${origin}/auth/update-password`)
        
        case 'signup':
          // Email confirmation - redirect to dashboard with welcome message
          return NextResponse.redirect(`${origin}/dashboard?welcome=true`)
        
        case 'email_change':
          // Email change confirmation - redirect to settings with success message
          return NextResponse.redirect(`${origin}/settings/account?email_updated=true`)
        
        default:
          // Default redirect
          return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error('Unexpected auth callback error:', error)
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`
      )
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent('Invalid authentication link.')}`
  )
}
