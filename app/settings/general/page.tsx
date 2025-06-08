"use client"

import { useState } from "react"
import { SettingsPageTitle } from "@/components/settings/settings-page-title"
import { SettingsCard } from "@/components/settings/settings-card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"

export default function GeneralSettingsPage() {
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("America/New_York")
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")
  const [timeFormat, setTimeFormat] = useState("12-hour")
  const [theme, setTheme] = useState("system")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [inAppNotifications, setInAppNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)

  const handleSaveChanges = () => {
    // In a real app, you would save these settings to a backend
    console.log({
      language,
      timezone,
      dateFormat,
      timeFormat,
      theme,
      emailNotifications,
      inAppNotifications,
      pushNotifications,
    })
    toast({
      title: "Settings Saved",
      description: "Your general settings have been updated.",
    })
  }

  return (
    <div className="space-y-6">
      <SettingsPageTitle title="General Settings" description="Manage your application preferences and localization." />

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Localization</SettingsCard.Title>
          <SettingsCard.Description>Set your preferred language and timezone.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" className="w-full md:w-1/2">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español (Spanish)</SelectItem>
                <SelectItem value="fr">Français (French)</SelectItem>
                <SelectItem value="de">Deutsch (German)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone" className="w-full md:w-1/2">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                <SelectItem value="Australia/Sydney">Australia/Sydney (AEST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SettingsCard.Content>
      </SettingsCard>

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Date & Time</SettingsCard.Title>
          <SettingsCard.Description>Customize how dates and times are displayed.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="date-format">Date Format</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger id="date-format" className="w-full md:w-1/2">
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="time-format">Time Format</Label>
            <Select value={timeFormat} onValueChange={setTimeFormat}>
              <SelectTrigger id="time-format" className="w-full md:w-1/2">
                <SelectValue placeholder="Select time format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12-hour">12-hour</SelectItem>
                <SelectItem value="24-hour">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SettingsCard.Content>
      </SettingsCard>

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Theme</SettingsCard.Title>
          <SettingsCard.Description>Choose your preferred application theme.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-full md:w-1/2">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">
            Note: Theme switching might require integration with a theme provider like `next-themes`.
          </p>
        </SettingsCard.Content>
      </SettingsCard>

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Notifications</SettingsCard.Title>
          <SettingsCard.Description>Manage your notification preferences.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
              <span>Email Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive important updates via email.
              </span>
            </Label>
            <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="in-app-notifications" className="flex flex-col space-y-1">
              <span>In-App Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Get notified directly within the app.
              </span>
            </Label>
            <Switch id="in-app-notifications" checked={inAppNotifications} onCheckedChange={setInAppNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
              <span>Push Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Enable browser push notifications for real-time alerts.
              </span>
            </Label>
            <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
          </div>
        </SettingsCard.Content>
      </SettingsCard>

      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  )
}
