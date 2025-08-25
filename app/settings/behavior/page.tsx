"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { SettingsPageTitle } from "@/components/settings/settings-page-title"

type CompletedTaskBehavior = "immediately" | "daily" | "manually"

interface AppBehaviorSettings {
  completedTaskBehavior: CompletedTaskBehavior
}

export default function AppBehaviorSettingsPage() {
  const [completedTaskBehavior, setCompletedTaskBehavior] = useState<CompletedTaskBehavior>("immediately")
  const [isLoading, setIsLoading] = useState(false)

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("app-behavior-settings")
    if (savedSettings) {
      try {
        const parsed: AppBehaviorSettings = JSON.parse(savedSettings)
        setCompletedTaskBehavior(parsed.completedTaskBehavior || "immediately")
      } catch (error) {
        console.error("Failed to parse app behavior settings:", error)
      }
    }
  }, [])

  const handleSaveChanges = async () => {
    setIsLoading(true)
    
    try {
      const settings: AppBehaviorSettings = {
        completedTaskBehavior,
      }
      
      // Save to localStorage for now (in a real app, this would be saved to backend)
      localStorage.setItem("app-behavior-settings", JSON.stringify(settings))
      
      // Dispatch a custom event to notify other components of the settings change
      window.dispatchEvent(new CustomEvent("app-behavior-settings-changed", { 
        detail: settings 
      }))
      
      toast({
        title: "Settings Saved",
        description: "Your app behavior settings have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getBehaviorDescription = (behavior: CompletedTaskBehavior) => {
    switch (behavior) {
      case "immediately":
        return "Completed tasks disappear from their original view immediately and only appear in the Completed view."
      case "daily":
        return "Completed tasks remain in their original view until the end of the day (midnight), then move to Completed view only."
      case "manually":
        return "Completed tasks remain in their original view until you manually remove them. They also appear in the Completed view."
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <SettingsPageTitle 
        title="App Behavior Settings" 
        description="Configure how the application behaves when you complete tasks and other interactions." 
      />

      <Card>
        <CardHeader>
          <CardTitle>Task Completion Behavior</CardTitle>
          <CardDescription>
            Control when completed tasks are moved from their original view to the Completed view.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="completed-task-behavior">Move completed tasks to Completed View</Label>
            <Select
              value={completedTaskBehavior}
              onValueChange={(value: CompletedTaskBehavior) => setCompletedTaskBehavior(value)}
            >
              <SelectTrigger id="completed-task-behavior" className="w-full">
                <SelectValue placeholder="Select behavior" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediately">Immediately</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="manually">Manually</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getBehaviorDescription(completedTaskBehavior)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveChanges} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
