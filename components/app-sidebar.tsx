"use client"

import { useMemo } from "react"
import { Calendar, CheckCircle, Clock, Inbox, PauseCircle, Trash2, Search } from "lucide-react"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { WeeklySection } from "./weekly-section"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/context"

// This is sample data.
const staticData = {
  navMain: [
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
      isActive: true,
    },
    {
      title: "Today",
      url: "#",
      icon: Calendar,
    },
    {
      title: "Scheduled",
      url: "#",
      icon: Clock,
    },
    {
      title: "Deferred",
      url: "#",
      icon: PauseCircle,
    },
    {
      title: "Completed",
      url: "#",
      icon: CheckCircle,
    },
  ],
  weeklySection: {
    title: "This Week",
    isExpandable: true,
    lists: [
      {
        name: "List A",
        url: "#",
      },
      {
        name: "List B",
        url: "#",
      },
      {
        name: "List C",
        url: "#",
      },
    ],
  },
  projects: {
    title: "Projects",
    isHeader: true,
    areas: [
      {
        name: "Area 1",
        lists: [
          {
            name: "List A",
            url: "#",
          },
          {
            name: "List B",
            url: "#",
          },
        ],
      },
      {
        name: "Area 2",
        lists: [
          {
            name: "List C",
            url: "#",
          },
          {
            name: "List D",
            url: "#",
          },
        ],
      },
    ],
    standaloneLists: [
      {
        name: "List E",
        url: "#",
      },
    ],
  },
  footerNav: [
    {
      title: "Trash",
      url: "#",
      icon: Trash2,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSearchClick?: () => void
}

export function AppSidebar({ onSearchClick, ...props }: AppSidebarProps) {
  const { user, userProfile, loading } = useAuth()

  // Create user data object for NavUser component
  const userData = useMemo(() => {
    if (!user) {
      return {
        name: "Guest",
        email: "guest@example.com",
        avatar: "/placeholder.svg",
      }
    }

    const displayName = userProfile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
    const avatarUrl = userProfile?.avatar_url || user.user_metadata?.avatar_url || "/placeholder.svg"

    return {
      name: displayName,
      email: user.email || "",
      avatar: avatarUrl,
    }
  }, [user, userProfile])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-2 py-2">
          <Button variant="outline" className="w-full justify-start text-sm h-8" onClick={onSearchClick}>
            <Search className="h-4 w-4 mr-2" />
            Search
            <span className="ml-auto opacity-60 text-xs">⌘F</span>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col h-full bg-[#fafafa]">
        <div className="flex-grow space-y-2">
          <NavMain items={staticData.navMain} />
          <div className="h-2" aria-hidden="true" /> {/* Separator */}
          {/* Single "This Week" section with collapsible behavior */}
          <div className="compact-list-tabs">
            <WeeklySection weeklySection={staticData.weeklySection} />
          </div>
          <div className="h-2" aria-hidden="true" /> {/* Separator */}
          <div className="compact-list-tabs">
            <NavProjects projects={staticData.projects} />
          </div>
        </div>

        {/* Footer navigation fixed at the bottom */}
        <div className="mt-auto pt-2">
          <NavMain items={staticData.footerNav} />
        </div>
      </SidebarContent>
      <SidebarFooter className="bg-[#fafafa]">
        {loading ? (
          <div className="flex items-center space-x-2 p-2">
            <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <NavUser user={userData} />
        )}
      </SidebarFooter>
      <SidebarRail />
      <style jsx global>{`
        .compact-list-tabs [data-sidebar="menu-button"] {
          height: 26px !important;
        }
      `}</style>
    </Sidebar>
  )
}
