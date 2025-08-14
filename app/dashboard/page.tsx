"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "../../components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TaskList } from "@/components/task/task-list"

import { TrashView } from "@/components/task/trash-view"
import { CompletedView } from "@/components/task/completed-view"
import { ProjectView } from "@/components/project-view"
import { TaskProvider, useTaskContext } from "@/components/task/task-context"
import { SearchDialog } from "@/components/search-dialog"
import { DragContextProvider } from "../../components/task/drag-context"
import { ScheduledView } from "@/components/task/scheduled-view"
import { useRequireAuth } from "@/lib/auth/context"
import { DragDropTest } from "@/components/test/drag-drop-test"

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
    case "trash":
      return <TrashView />
    case "scheduled":
      return <ScheduledView />
    case "list":
      // Check if this is the completed view
      if (activeListId === "completed") {
        return <CompletedView />
      }
      // Check if this is a project view
      if (projects && projects[activeListId]) {
        return <ProjectView projectId={activeListId} />
      }
      // Handle specific view types with proper filtering
      if (activeListId === "inbox") {
        return <TaskList initialTasks={[]} title="Inbox" view="inbox" />
      }
      if (activeListId === "today") {
        return <TaskList initialTasks={[]} title="Today" view="today" />
      }
      if (activeListId === "deferred") {
        return <TaskList initialTasks={[]} title="Deferred" view="deferred" />
      }
      // Default task list view (for other lists/projects)
      return <TaskList initialTasks={getTasksForList(activeListId)} title={getListTitle(activeListId)} />
    default:
      return <TaskList initialTasks={getTasksForList(activeListId)} title={getListTitle(activeListId)} />
  }
}

export default function Page() {
  const { user, loading } = useRequireAuth()
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

    window.addEventListener("keydown", handleKeyDown, { passive: false })
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // If no user, useRequireAuth will handle the redirect
  if (!user) {
    return null
  }

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

          {/* Test Component for Drag & Drop */}
          <DragDropTest />
        </SidebarProvider>
      </DragContextProvider>
    </TaskProvider>
  )
}
