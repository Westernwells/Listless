"use client"

import type * as React from "react"
import { Calendar, CheckCircle, Clock, Inbox, PauseCircle, Trash2, Search, BookCheck } from "lucide-react"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { WeeklySection } from "./weekly-section"
import { Button } from "@/components/ui/button"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
    {
      title: "Logbook",
      url: "#",
      icon: BookCheck,
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
          <NavMain items={data.navMain} />
          <div className="h-2" aria-hidden="true" /> {/* Separator */}
          {/* Single "This Week" section with collapsible behavior */}
          <div className="compact-list-tabs">
            <WeeklySection weeklySection={data.weeklySection} />
          </div>
          <div className="h-2" aria-hidden="true" /> {/* Separator */}
          <div className="compact-list-tabs">
            <NavProjects projects={data.projects} />
          </div>
        </div>

        {/* Footer navigation fixed at the bottom */}
        <div className="mt-auto pt-2">
          <NavMain items={data.footerNav} />
        </div>
      </SidebarContent>
      <SidebarFooter className="bg-[#fafafa]">
        <NavUser user={data.user} />
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
