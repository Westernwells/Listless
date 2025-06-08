"use client"

import { useState } from "react"
import { SettingsPageTitle } from "@/components/settings/settings-page-title"
import { SettingsCard } from "@/components/settings/settings-card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Trash2, RefreshCw, CalendarIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ConnectedCalendar {
  id: string
  name: string
  email: string
  type: "google" | "outlook"
}

export default function CalendarSettingsPage() {
  const [connectedCalendars, setConnectedCalendars] = useState<ConnectedCalendar[]>([
    { id: "cal1", name: "Work Calendar", email: "work@example.com", type: "google" },
  ])
  const [syncAllTasks, setSyncAllTasks] = useState(true)
  const [syncFrequency, setSyncFrequency] = useState("15min")

  const handleConnectCalendar = (type: "google" | "outlook") => {
    toast({
      title: `Connect ${type === "google" ? "Google" : "Outlook"} Calendar`,
      description: `Initiating OAuth flow for ${type} calendar...`,
    })
    // Placeholder: Add a new calendar after successful OAuth
    // This is a mock, in reality, you'd get this info from OAuth
    const newCalId = `cal${connectedCalendars.length + 1}`
    setConnectedCalendars((prev) => [
      ...prev,
      {
        id: newCalId,
        name: `${type === "google" ? "Google" : "Outlook"} Calendar ${prev.length + 1}`,
        email: `new-${type}@example.com`,
        type: type,
      },
    ])
  }

  const handleDisconnectCalendar = (calendarId: string) => {
    toast({
      title: "Disconnect Calendar",
      description: `Are you sure you want to disconnect this calendar?`,
      action: (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setConnectedCalendars((prev) => prev.filter((cal) => cal.id !== calendarId))
            toast({ title: "Calendar Disconnected", description: "The calendar has been successfully disconnected." })
          }}
        >
          Confirm
        </Button>
      ),
    })
  }

  const handleSyncNow = (calendarId: string) => {
    toast({
      title: "Syncing Calendar",
      description: `Manually syncing calendar ${calendarId}...`,
    })
    // Actual sync logic here
  }

  const handleSaveChanges = () => {
    toast({
      title: "Sync Settings Saved",
      description: "Your calendar sync preferences have been updated.",
    })
  }

  return (
    <div className="space-y-6">
      <SettingsPageTitle title="Calendar Integration" description="Connect and manage your calendar integrations." />

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Connect New Calendar</SettingsCard.Title>
          <SettingsCard.Description>Link your external calendars to sync events and tasks.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content className="flex space-x-2">
          <Button onClick={() => handleConnectCalendar("google")}>
            <CalendarIcon className="mr-2 h-4 w-4" /> Connect Google Calendar
          </Button>
          <Button onClick={() => handleConnectCalendar("outlook")}>
            <CalendarIcon className="mr-2 h-4 w-4" /> Connect Outlook Calendar
          </Button>
        </SettingsCard.Content>
      </SettingsCard>

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Connected Calendars</SettingsCard.Title>
          <SettingsCard.Description>Manage your currently linked calendars.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content className="space-y-4">
          {connectedCalendars.length === 0 && <p className="text-muted-foreground">No calendars connected yet.</p>}
          {connectedCalendars.map((calendar) => (
            <div key={calendar.id} className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {calendar.name} ({calendar.type})
                  </p>
                  <p className="text-sm text-muted-foreground">{calendar.email}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleSyncNow(calendar.id)} title="Sync Now">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDisconnectCalendar(calendar.id)}
                    title="Disconnect"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </SettingsCard.Content>
      </SettingsCard>

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Sync Settings</SettingsCard.Title>
          <SettingsCard.Description>Configure how your tasks and events are synchronized.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sync-all-tasks" className="flex flex-col space-y-1">
              <span>Sync All Tasks</span>
              <span className="font-normal leading-snug text-muted-foreground">
                If disabled, only tasks with due dates will be synced.
              </span>
            </Label>
            <Switch id="sync-all-tasks" checked={syncAllTasks} onCheckedChange={setSyncAllTasks} />
          </div>
          <Separator />
          <div className="grid gap-2">
            <Label htmlFor="sync-frequency">Automatic Sync Frequency</Label>
            <Select value={syncFrequency} onValueChange={setSyncFrequency}>
              <SelectTrigger id="sync-frequency" className="w-full md:w-1/2">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15min">Every 15 minutes</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="manual">Manual Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveChanges}>Save Sync Settings</Button>
          </div>
        </SettingsCard.Content>
      </SettingsCard>
    </div>
  )
}
