"use client"

import { useState, useMemo } from "react"
import { parseISO, isToday, isThisWeek, isThisMonth } from "date-fns"
import { Filter, ArrowUpDown, CircleCheckBig } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCompletedTasks, useToggleTask } from "@/hooks/use-tasks"
import { useCompletedTaskCount } from "@/hooks/use-task-counts"
import { TaskList } from "./task-list"

type SortOrder = "newest" | "oldest"
type FilterBy = "all" | "today" | "week" | "month"

export function CompletedView() {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [filterBy, setFilterBy] = useState<FilterBy>("all")

  // Get completed tasks using TanStack Query
  const { data: completedTasks = [], isLoading } = useCompletedTasks()

  // Get dynamic task count for the header
  const { data: completedCount = 0 } = useCompletedTaskCount()

  // Apply date filtering and sorting
  const processedTasks = useMemo(() => {
    let filtered = completedTasks

    // Apply date filtering
    if (filterBy !== "all") {
      filtered = completedTasks.filter((task) => {
        if (!task.completedAt) return false

        const completedDate = parseISO(task.completedAt)

        switch (filterBy) {
          case "today":
            return isToday(completedDate)
          case "week":
            return isThisWeek(completedDate)
          case "month":
            return isThisMonth(completedDate)
          default:
            return true
        }
      })
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB
    })
  }, [completedTasks, filterBy, sortOrder])

  const getFilterLabel = (filter: FilterBy) => {
    switch (filter) {
      case "all": return "All time"
      case "today": return "Today"
      case "week": return "This Week"
      case "month": return "This Month"
      default: return "All time"
    }
  }

  const getSortLabel = (sort: SortOrder) => {
    return sort === "newest" ? "Newest" : "Oldest"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header matching Today view styling */}
      <div className="px-12 pt-12 pb-6">
        <div className="grid grid-cols-3 items-center">
          {/* Left: Title and count */}
          <div className="justify-self-start">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CircleCheckBig className="h-5 w-5 text-muted-foreground" />
              Completed
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount} completed tasks
            </p>
          </div>

          {/* Center: Empty space */}
          <div></div>

          {/* Right: Sort and Filter buttons */}
          <div className="justify-self-end">
            <div className="flex items-center gap-3">
              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-black text-white hover:bg-black/90 h-7 px-2.5 text-xs gap-0"
                  >
                    <ArrowUpDown className="h-4 w-4 mr-1 text-white" />
                    Sort by: {getSortLabel(sortOrder)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Newest
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Oldest
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-black text-white hover:bg-black/90 h-7 px-2.5 text-xs gap-0"
                  >
                    <Filter className="h-4 w-4 mr-1 text-white" />
                    Filter by: {getFilterLabel(filterBy)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setFilterBy("all")}>
                      <Filter className="h-4 w-4 mr-2" />
                      All time
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterBy("today")}>
                      <Filter className="h-4 w-4 mr-2" />
                      Today
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterBy("week")}>
                      <Filter className="h-4 w-4 mr-2" />
                      This Week
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterBy("month")}>
                      <Filter className="h-4 w-4 mr-2" />
                      This Month
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Use TaskList component for consistent layout */}
      <div className="flex-1 overflow-auto w-full task-list-container pl-8 pt-4">
        <TaskList
          initialTasks={processedTasks}
          title="Completed"
          showHeader={false}
          view="completed"
        />
      </div>
    </div>
  )
}
