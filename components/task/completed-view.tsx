"use client"

import { useState, useMemo } from "react"
import { parseISO, isToday, isThisWeek, isThisMonth } from "date-fns"
import { Filter, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCompletedTasks, useToggleTask } from "@/hooks/use-tasks"
import { TaskList } from "./task-list"

type SortOrder = "newest" | "oldest"
type FilterBy = "all" | "today" | "week" | "month"

export function CompletedView() {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [filterBy, setFilterBy] = useState<FilterBy>("all")

  // Get completed tasks using TanStack Query
  const { data: completedTasks = [], isLoading } = useCompletedTasks()

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
      {/* Custom header with controls */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-semibold">Completed</h1>
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <ArrowUpDown className="h-4 w-4 mr-1" />
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
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-4 w-4 mr-1" />
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

      {/* Use TaskList component for consistent layout */}
      <div className="flex-1">
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
