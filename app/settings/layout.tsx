"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, User, Settings, CreditCard, DollarSign, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const settingsNavItems = [
  {
    title: "Account",
    href: "/settings/account",
    icon: User,
  },
  {
    title: "General",
    href: "/settings/general",
    icon: Settings,
  },
  {
    title: "Subscription",
    href: "/settings/subscription",
    icon: CreditCard,
  },
  {
    title: "Billing",
    href: "/settings/billing",
    icon: DollarSign,
  },
  {
    title: "Calendar",
    href: "/settings/calendar",
    icon: Calendar,
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background">
      {/* Settings Sidebar */}
      <div className="w-64 border-r bg-muted/10 flex flex-col">
        {/* Header with back button */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Dashboard</span>
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {settingsNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">{children}</div>
    </div>
  )
}
