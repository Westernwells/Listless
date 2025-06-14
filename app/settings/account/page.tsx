"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { SettingsPageTitle } from "@/components/settings/settings-page-title"
import { SettingsCard } from "@/components/settings/settings-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChangeEmailModal } from "@/components/settings/account/change-email-modal"
import { ResetPasswordModal } from "@/components/settings/account/reset-password-modal"
import { DeleteAccountModal } from "@/components/settings/account/delete-account-modal"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/context"
import { Mail, KeyRound, Trash2, Github, Gitlab, AtSign, CheckCircle } from "lucide-react"

export default function AccountSettingsPage() {
  const { user: authUser, userProfile, loading } = useAuth()
  const [user, setUser] = useState({
    name: userProfile?.name || authUser?.user_metadata?.name || "",
    email: authUser?.email || "",
    avatarUrl: userProfile?.avatar_url || "/placeholder.svg?width=128&height=128",
    bio: userProfile?.bio || "",
  })

  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false)
  const [emailUpdated, setEmailUpdated] = useState(false)
  const [welcomeMessage, setWelcomeMessage] = useState(false)

  useEffect(() => {
    // Update user state when auth data changes
    if (authUser && userProfile) {
      setUser({
        name: userProfile.name || authUser.user_metadata?.name || "",
        email: authUser.email || "",
        avatarUrl: userProfile.avatar_url || "/placeholder.svg?width=128&height=128",
        bio: userProfile.bio || "",
      })
    }

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('email_updated') === 'true') {
      setEmailUpdated(true)
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (urlParams.get('welcome') === 'true') {
      setWelcomeMessage(true)
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [authUser, userProfile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileUpdate = () => {
    // API call to update profile
    console.log("Profile updated:", user)
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    })
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      // Simulate avatar upload and update
      const reader = new FileReader()
      reader.onloadend = () => {
        setUser((prev) => ({ ...prev, avatarUrl: reader.result as string }))
        toast({ title: "Avatar Updated", description: "Your avatar has been changed." })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-8">
      <SettingsPageTitle title="Account Settings" description="Manage your account information and preferences." />

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Profile Information</SettingsCard.Title>
          <SettingsCard.Description>Update your personal details and avatar.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content>
          <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-2">
              <Label
                htmlFor="avatar-upload"
                className="cursor-pointer text-sm font-medium text-primary hover:underline"
              >
                Change Avatar
              </Label>
              <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB.</p>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={user.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center space-x-2">
                <Input id="email" name="email" type="email" value={user.email} disabled className="flex-grow" />
                <Button variant="outline" size="sm" onClick={() => setIsChangeEmailModalOpen(true)}>
                  <Mail className="mr-2 h-4 w-4" /> Change
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              name="bio"
              value={user.bio}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell us a little about yourself"
            />
          </div>
        </SettingsCard.Content>
        <SettingsCard.Footer>
          <Button onClick={handleProfileUpdate} className="ml-auto">
            Save Profile
          </Button>
        </SettingsCard.Footer>
      </SettingsCard>

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Security</SettingsCard.Title>
          <SettingsCard.Description>Manage your password and account security.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content>
          <Button variant="outline" onClick={() => setIsResetPasswordModalOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
          </Button>
        </SettingsCard.Content>
      </SettingsCard>

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Connected Accounts</SettingsCard.Title>
          <SettingsCard.Description>Manage your third-party account integrations.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center">
              <Github className="h-6 w-6 mr-3" />
              <div>
                <p className="font-medium">GitHub</p>
                <p className="text-sm text-muted-foreground">Not connected</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Connect
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center">
              <Gitlab className="h-6 w-6 mr-3" />
              <div>
                <p className="font-medium">GitLab</p>
                <p className="text-sm text-muted-foreground">
                  Connected as @{user.name.toLowerCase().replace(" ", "_")}
                </p>
              </div>
            </div>
            <Button variant="destructiveOutline" size="sm">
              Disconnect
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center">
              <AtSign className="h-6 w-6 mr-3" />
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-muted-foreground">Connected as {user.email}</p>
              </div>
            </div>
            <Button variant="destructiveOutline" size="sm">
              Disconnect
            </Button>
          </div>
        </SettingsCard.Content>
      </SettingsCard>

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Delete Account</SettingsCard.Title>
          <SettingsCard.Description>
            Permanently delete your account and all associated data. This action cannot be undone.
          </SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content>
          <Button variant="destructive" onClick={() => setIsDeleteAccountModalOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete My Account
          </Button>
        </SettingsCard.Content>
      </SettingsCard>

      <ChangeEmailModal
        isOpen={isChangeEmailModalOpen}
        onClose={() => setIsChangeEmailModalOpen(false)}
        currentEmail={user.email}
      />
      <ResetPasswordModal isOpen={isResetPasswordModalOpen} onClose={() => setIsResetPasswordModalOpen(false)} />
      <DeleteAccountModal isOpen={isDeleteAccountModalOpen} onClose={() => setIsDeleteAccountModalOpen(false)} />
    </div>
  )
}
