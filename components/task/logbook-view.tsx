"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { CheckCircle, Filter, Calendar, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTaskContext } from "./task-context"
import { TaskItem } from "./task-item"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LogbookView() {
  const { getTasksForList, toggleTask, deleteTask } = useTaskContext()
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [filterBy, setFilterBy] = useState<"all" | "today" | "week" | "month">("all")

  // Get completed tasks from the logbook
  const completedTasks = getTasksForList("logbook")

  // Sort tasks based on completion date
  const sortedTasks = [...completedTasks].sort((a, b) => {
    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0
    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB
  })

  // Filter tasks based on completion date
  const filteredTasks = sortedTasks.filter((task) => {
    if (filterBy === "all") return true
    if (!task.completedAt) return false

    const completedDate = parseISO(task.completedAt)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (filterBy === "today") {
      return completedDate >= today
    }

    if (filterBy === "week") {
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      return completedDate >= weekAgo
    }

    if (filterBy === "month") {
      const monthAgo = new Date(today)
      monthAgo.setMonth(today.getMonth() - 1)
      return completedDate >= monthAgo
    }

    return true
  })

  // Group tasks by completion date
  const groupedTasks: Record<string, typeof filteredTasks> = {}

  filteredTasks.forEach((task) => {
    if (task.completedAt) {
      const dateStr = format(parseISO(task.completedAt), "yyyy-MM-dd")
      if (!groupedTasks[dateStr]) {
        groupedTasks[dateStr] = []
      }
      groupedTasks[dateStr].push(task)
    }
  })

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => {
    return sortOrder === "newest" ? b.localeCompare(a) : a.localeCompare(b)
  })

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
          Logbook
        </h1>
        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-4 w-4 mr-1" />
                {filterBy === "all"
                  ? "All Time"
                  : filterBy === "today"
                    ? "Today"
                    : filterBy === "week"
                      ? "This Week"
                      : "This Month"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setFilterBy("all")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  All Time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("today")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("week")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  This Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("month")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  This Month
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <ArrowUpDown className="h-4 w-4 mr-1" />
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Oldest First
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {sortedDates.length > 0 ? (
          sortedDates.map((dateStr) => (
            <div key={dateStr} className="mb-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">
                {format(parseISO(dateStr), "EEEE, MMMM d, yyyy")}
              </h2>
              <div className="space-y-1">
                {groupedTasks[dateStr].map((task) => (
                  <div key={task.id} className="flex items-center group">
                    <TaskItem
                      id={task.id}
                      content={task.content}
                      checked={task.checked}
                      dueDate={task.dueDate}
                      flagged={task.flagged}
                      tags={task.tags}
                      onToggle={() => toggleTask(task.id)}
                      onEdit={() => {}}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <CheckCircle className="h-12 w-12 mb-2 opacity-20" />
            <p>No completed tasks</p>
            {filterBy !== "all" && (
              <Button variant="link" onClick={() => setFilterBy("all")}>
                View all completed tasks
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
