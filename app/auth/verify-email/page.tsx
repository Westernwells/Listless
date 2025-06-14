'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icons } from '@/components/ui/icons'
import { resendConfirmation } from '@/lib/auth/actions'
import { withoutAuth } from '@/lib/auth/context'
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  const handleResendConfirmation = async () => {
    if (!email) return

    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const result = await resendConfirmation(email)
      
      if (result.success) {
        setResendSuccess(true)
      } else {
        setResendError(result.error || 'Failed to resend confirmation email')
      }
    } catch (error) {
      setResendError('An unexpected error occurred. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification link to your email address
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verify your email address</CardTitle>
            <CardDescription>
              {email ? (
                <>We sent a verification link to <strong>{email}</strong></>
              ) : (
                'We sent a verification link to your email address'
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-800">
                  Click the link in your email to verify your account and complete the setup process.
                </p>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>Didn't receive the email? Check your spam folder or try resending it.</p>
                
                {resendSuccess && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Verification email sent successfully! Check your inbox.
                    </AlertDescription>
                  </Alert>
                )}

                {resendError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{resendError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            {email && (
              <Button
                onClick={handleResendConfirmation}
                variant="outline"
                className="w-full"
                disabled={isResending || resendSuccess}
              >
                {isResending && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                {resendSuccess ? 'Email sent!' : 'Resend verification email'}
              </Button>
            )}

            <Button asChild className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link
              href="/support"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default withoutAuth(VerifyEmailPage)
