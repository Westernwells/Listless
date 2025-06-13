"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "../../components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TaskList } from "@/components/task/task-list"
import { LogbookView } from "@/components/task/logbook-view"
import { TrashView } from "@/components/task/trash-view"
import { ProjectView } from "@/components/project-view"
import { TaskProvider, useTaskContext } from "@/components/task/task-context"
import { SearchDialog } from "@/components/search-dialog"
import { DragContextProvider } from "../../components/task/drag-context"
import { ScheduledView } from "@/components/task/scheduled-view"

function TaskContent() {
  const { activeListId, getTasksForList, getListTitle, currentView, allTasks, toggleTask, addTask, projects } =
    useTaskContext()

  if (!activeListId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a list from the sidebar</p>
      </div>
    )
  }

  // Show different views based on the current view type
  switch (currentView) {
    case "logbook":
      return <LogbookView />
    case "trash":
      return <TrashView />
    case "scheduled":
      return <ScheduledView />
    case "list":
      // Check if this is a project view
      if (projects && projects[activeListId]) {
        return <ProjectView projectId={activeListId} />
      }
      // Default task list view
      return <TaskList initialTasks={getTasksForList(activeListId)} title={getListTitle(activeListId)} />
    default:
      return <TaskList initialTasks={getTasksForList(activeListId)} title={getListTitle(activeListId)} />
  }
}

export default function Page() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+F or Ctrl+F for search
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <TaskProvider>
      <DragContextProvider>
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <AppSidebar onSearchClick={() => setIsSearchOpen(true)} />
            <main className="flex-1 overflow-hidden w-full">
              <TaskContent />
            </main>
          </div>

          {/* Global Dialogs */}
          <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
        </SidebarProvider>
      </DragContextProvider>
    </TaskProvider>
  )
}
