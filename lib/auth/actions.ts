'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server actions for authentication operations
 * These functions handle all authentication-related server-side operations
 */

export interface AuthResult {
  success: boolean
  error?: string
  message?: string
}

export interface SignUpData {
  email: string
  password: string
  name: string
}

export interface SignInData {
  email: string
  password: string
}

export interface ResetPasswordData {
  email: string
}

export interface UpdatePasswordData {
  password: string
  confirmPassword: string
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(data: SignUpData): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: 'Check your email for a verification link to complete your account setup.',
    }
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during sign up.',
    }
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(data: SignInData): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: 'Successfully signed in.',
    }
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during sign in.',
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: 'Successfully signed out.',
    }
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred during sign out.',
    }
  }
}

/**
 * Send a password reset email
 */
export async function resetPassword(data: ResetPasswordData): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: 'Check your email for a password reset link.',
    }
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred while sending the reset email.',
    }
  }
}

/**
 * Update user password (used after password reset)
 */
export async function updatePassword(data: UpdatePasswordData): Promise<AuthResult> {
  if (data.password !== data.confirmPassword) {
    return {
      success: false,
      error: 'Passwords do not match.',
    }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: 'Password updated successfully.',
    }
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred while updating the password.',
    }
  }
}

/**
 * Update user email
 */
export async function updateEmail(newEmail: string, password: string): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    // First verify the current password
    const { data: user } = await supabase.auth.getUser()
    if (!user.user?.email) {
      return {
        success: false,
        error: 'No authenticated user found.',
      }
    }

    // Verify current password by attempting to sign in
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.user.email,
      password: password,
    })

    if (passwordError) {
      return {
        success: false,
        error: 'Current password is incorrect.',
      }
    }

    // Update email
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: 'Check your new email address for a confirmation link.',
    }
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred while updating the email.',
    }
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteAccount(password: string): Promise<AuthResult> {
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()

  try {
    // Get current user
    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user.user) {
      return {
        success: false,
        error: 'No authenticated user found.',
      }
    }

    // Verify password
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.user.email!,
      password: password,
    })

    if (passwordError) {
      return {
        success: false,
        error: 'Password is incorrect.',
      }
    }

    // Delete user data using service client (bypasses RLS)
    const userId = user.user.id

    // Delete in reverse order of dependencies
    await serviceSupabase.from('task_tags').delete().eq('task_id', userId)
    await serviceSupabase.from('action_history').delete().eq('user_id', userId)
    await serviceSupabase.from('tasks').delete().eq('user_id', userId)
    await serviceSupabase.from('tags').delete().eq('user_id', userId)
    await serviceSupabase.from('project_lists').delete().eq('user_id', userId)
    await serviceSupabase.from('areas').delete().eq('user_id', userId)
    await serviceSupabase.from('connected_accounts').delete().eq('user_id', userId)
    await serviceSupabase.from('billing_details').delete().eq('user_id', userId)
    await serviceSupabase.from('subscriptions').delete().eq('user_id', userId)
    await serviceSupabase.from('user_settings').delete().eq('user_id', userId)
    await serviceSupabase.from('users').delete().eq('id', userId)

    // Delete auth user (this will cascade delete the user record)
    const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      return {
        success: false,
        error: 'Failed to delete account. Please try again.',
      }
    }

    return {
      success: true,
      message: 'Account deleted successfully.',
    }
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the account.',
    }
  }
}

/**
 * Resend email confirmation
 */
export async function resendConfirmation(email: string): Promise<AuthResult> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: 'Confirmation email sent. Please check your inbox.',
    }
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred while sending the confirmation email.',
    }
  }
}

/**
 * Server action wrappers for form submissions
 */

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const result = await signUp({ email, password, name })

  if (result.success) {
    redirect('/auth/verify-email?email=' + encodeURIComponent(email))
  } else {
    redirect('/auth/signup?error=' + encodeURIComponent(result.error || 'Unknown error'))
  }
}

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const result = await signIn({ email, password })

  if (result.success) {
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } else {
    redirect('/auth/login?error=' + encodeURIComponent(result.error || 'Unknown error'))
  }
}

export async function signOutAction() {
  const result = await signOut()

  if (result.success) {
    revalidatePath('/', 'layout')
    redirect('/auth/login')
  } else {
    redirect('/dashboard?error=' + encodeURIComponent(result.error || 'Unknown error'))
  }
}

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get('email') as string

  const result = await resetPassword({ email })

  if (result.success) {
    redirect('/auth/reset-password?success=' + encodeURIComponent(result.message || 'Email sent'))
  } else {
    redirect('/auth/reset-password?error=' + encodeURIComponent(result.error || 'Unknown error'))
  }
}

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  const result = await updatePassword({ password, confirmPassword })

  if (result.success) {
    revalidatePath('/', 'layout')
    redirect('/dashboard?success=' + encodeURIComponent(result.message || 'Password updated'))
  } else {
    redirect('/auth/update-password?error=' + encodeURIComponent(result.error || 'Unknown error'))
  }
}
