"use client"

import { useState } from "react"
import { User, Settings, CreditCard, DollarSign, Calendar, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Import existing settings page components
import AccountSettings from "@/app/settings/account/page"
import GeneralSettings from "@/app/settings/general/page"
import SubscriptionSettings from "@/app/settings/subscription/page"
import BillingSettings from "@/app/settings/billing/page"
import CalendarSettings from "@/app/settings/calendar/page"
import AppBehaviorSettings from "@/app/settings/behavior/page"

const settingsNavItems = [
  {
    id: "account",
    title: "Account",
    icon: User,
    component: AccountSettings,
  },
  {
    id: "general",
    title: "General",
    icon: Settings,
    component: GeneralSettings,
  },
  {
    id: "behavior",
    title: "App Behavior",
    icon: Zap,
    component: AppBehaviorSettings,
  },
  {
    id: "subscription",
    title: "Subscription",
    icon: CreditCard,
    component: SubscriptionSettings,
  },
  {
    id: "billing",
    title: "Billing",
    icon: DollarSign,
    component: BillingSettings,
  },
  {
    id: "calendar",
    title: "Calendar",
    icon: Calendar,
    component: CalendarSettings,
  },
]

export function SettingsView() {
  const [activeTab, setActiveTab] = useState("account")

  const activeItem = settingsNavItems.find(item => item.id === activeTab)
  const ActiveComponent = activeItem?.component

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-12 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        {/* Horizontal Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Settings tabs">
            {settingsNavItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-12 pb-8">
        {ActiveComponent && (
          <div className="max-w-4xl">
            <ActiveComponent />
          </div>
        )}
      </div>
    </div>
  )
}
