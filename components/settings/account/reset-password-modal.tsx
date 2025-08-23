"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { resetPassword } from "@/lib/auth/actions"
import { useAuth } from "@/lib/auth/context"

interface ResetPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetPasswordModal({ open, onOpenChange }: ResetPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.email) {
      setError("No email address found for current user")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await resetPassword({ email: user.email })

      if (result.success) {
        setSuccess(result.message || "Password reset email sent! Check your inbox.")
        // Don't close modal immediately to show success message
        setTimeout(() => {
          onOpenChange(false)
          setSuccess(null)
        }, 3000)
      } else {
        setError(result.error || "Failed to send password reset email")
      }
    } catch (error) {
      console.error("Failed to send password reset email:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            We'll send a password reset link to your email address.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {!success && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                A password reset link will be sent to: <strong>{user?.email}</strong>
              </p>

              <form onSubmit={handleSubmit}>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      onOpenChange(false)
                      setError(null)
                      setSuccess(null)
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="xs"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {success && (
            <div className="text-center">
              <Button
                onClick={() => {
                  onOpenChange(false)
                  setSuccess(null)
                }}
                size="xs"
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
