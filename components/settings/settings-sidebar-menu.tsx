"use client"

import { CalendarDays, CreditCard, FileText, SettingsIcon, User } from "lucide-react"
import { usePathname } from "next/navigation"
import type { MainNavItem } from "@/types"
import { SidebarNavItem, SidebarNav } from "@/components/ui/sidebar-nav"

interface DashboardSidebarProps {
  items?: MainNavItem[]
}

export function SettingsSidebarMenu({ items }: DashboardSidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    { href: "/settings/account", label: "Account", icon: User },
    { href: "/settings/general", label: "General", icon: SettingsIcon },
    { href: "/settings/subscription", label: "Subscription", icon: CreditCard },
    { href: "/settings/billing", label: "Billing", icon: FileText },
    { href: "/settings/calendar", label: "Calendar", icon: CalendarDays },
  ]

  return (
    <div className="flex flex-col space-y-6">
      <SidebarNav className="mt-6">
        {menuItems?.length ? (
          menuItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              title={item.label}
              isActive={pathname?.startsWith(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </SidebarNavItem>
          ))
        ) : (
          <>
            <SidebarNavItem title="Account" href="/settings/account">
              <User className="mr-2 h-4 w-4" />
              Account
            </SidebarNavItem>
            <SidebarNavItem title="General" href="/settings/general">
              <SettingsIcon className="mr-2 h-4 w-4" />
              General
            </SidebarNavItem>
          </>
        )}
      </SidebarNav>
    </div>
  )
}
