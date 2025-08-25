"use client"

import { useState, useEffect } from "react"

export type CompletedTaskBehavior = "immediately" | "daily" | "manually"

export interface AppBehaviorSettings {
  completedTaskBehavior: CompletedTaskBehavior
}

const DEFAULT_SETTINGS: AppBehaviorSettings = {
  completedTaskBehavior: "immediately"
}

/**
 * Hook to manage app behavior settings
 * Provides settings state and utilities to update them
 */
export function useAppBehaviorSettings() {
  const [settings, setSettings] = useState<AppBehaviorSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem("app-behavior-settings")
        if (savedSettings) {
          const parsed: AppBehaviorSettings = JSON.parse(savedSettings)
          setSettings({ ...DEFAULT_SETTINGS, ...parsed })
        }
      } catch (error) {
        console.error("Failed to load app behavior settings:", error)
        setSettings(DEFAULT_SETTINGS)
      } finally {
        setIsLoaded(true)
      }
    }

    loadSettings()

    // Listen for settings changes from other components
    const handleSettingsChange = (event: CustomEvent<AppBehaviorSettings>) => {
      setSettings(event.detail)
    }

    window.addEventListener("app-behavior-settings-changed", handleSettingsChange as EventListener)

    return () => {
      window.removeEventListener("app-behavior-settings-changed", handleSettingsChange as EventListener)
    }
  }, [])

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<AppBehaviorSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    try {
      localStorage.setItem("app-behavior-settings", JSON.stringify(updatedSettings))
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent("app-behavior-settings-changed", { 
        detail: updatedSettings 
      }))
    } catch (error) {
      console.error("Failed to save app behavior settings:", error)
    }
  }

  /**
   * Determines if a completed task should remain visible in its original view
   * based on the current behavior setting
   */
  const shouldKeepCompletedTaskInOriginalView = (completedAt?: string): boolean => {
    if (!completedAt) return false

    switch (settings.completedTaskBehavior) {
      case "immediately":
        return false // Remove immediately
      
      case "daily":
        // Keep until end of day
        const completedDate = new Date(completedAt)
        const now = new Date()
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        return completedDate <= endOfDay
      
      case "manually":
        return true // Keep until manually removed
      
      default:
        return false
    }
  }

  /**
   * Determines if it's time to move daily completed tasks
   * This would typically be called by a background process or on app startup
   */
  const shouldMoveDailyCompletedTasks = (): boolean => {
    return settings.completedTaskBehavior === "daily"
  }

  return {
    settings,
    isLoaded,
    updateSettings,
    shouldKeepCompletedTaskInOriginalView,
    shouldMoveDailyCompletedTasks,
  }
}
