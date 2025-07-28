"use client"

import type React from "react"

import { useState } from "react"

import { Clock, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTaskContext } from "./task-context"
import { useDragContext } from "./drag-context"
import { SortableTaskItem } from "./sortable-task-item"
// Removed DndContext imports - using global drag context instead
import { useDroppable } from "@dnd-kit/core"
import { addDays, isAfter, isSameDay, getMonth, getYear, format } from "date-fns"

interface ScheduledItem {
  id: string
  type: "task" | "project"
  content: string
  checked?: boolean
  dueDate: string
  tags?: string[]
  flagged?: boolean
  projectId?: string
}

interface DateSection {
  id: string
  title: string
  date: Date | null
  items: ScheduledItem[]
}

export function ScheduledView() {
  const { allTasks, projects, toggleTask, updateTaskDueDate, updateProject, getTasksForList } = useTaskContext()
  const { selectedTaskIds, setSelectedTaskIds } = useDragContext()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  // Current date for calculations (May 27th as specified)
  const currentDate = new Date(2024, 4, 27) // May 27, 2024 (Tuesday)

  // Removed sensors - using global drag context instead

  // Generate date sections based on the current date
  const generateDateSections = (): DateSection[] => {
    const sections: DateSection[] = []

    // Tomorrow (May 28)
    const tomorrow = addDays(currentDate, 1)
    sections.push({
      id: "tomorrow",
      title: "Tomorrow",
      date: tomorrow,
      items: [],
    })

    // Thursday (May 29)
    const thursday = addDays(currentDate, 2)
    sections.push({
      id: "thursday",
      title: "Thursday",
      date: thursday,
      items: [],
    })

    // Friday (May 30)
    const friday = addDays(currentDate, 3)
    sections.push({
      id: "friday",
      title: "Friday",
      date: friday,
      items: [],
    })

    // Saturday (May 31)
    const saturday = addDays(currentDate, 4)
    sections.push({
      id: "saturday",
      title: "Saturday",
      date: saturday,
      items: [],
    })

    // Sunday (June 1)
    const sunday = addDays(currentDate, 5)
    sections.push({
      id: "sunday",
      title: "Sunday",
      date: sunday,
      items: [],
    })

    // Monday (June 2)
    const monday = addDays(currentDate, 6)
    sections.push({
      id: "monday",
      title: "Monday",
      date: monday,
      items: [],
    })

    // Tuesday (June 3)
    const tuesday = addDays(currentDate, 7)
    sections.push({
      id: "tuesday",
      title: "Tuesday",
      date: tuesday,
      items: [],
    })

    // June 4-30
    sections.push({
      id: "june-rest",
      title: "June 4–30",
      date: null, // Special handling for date range
      items: [],
    })

    // July
    sections.push({
      id: "july",
      title: "July",
      date: new Date(2024, 6, 1), // July 1, 2024
      items: [],
    })

    // August
    sections.push({
      id: "august",
      title: "August",
      date: new Date(2024, 7, 1), // August 1, 2024
      items: [],
    })

    // September
    sections.push({
      id: "september",
      title: "September",
      date: new Date(2024, 8, 1), // September 1, 2024
      items: [],
    })

    // October
    sections.push({
      id: "october",
      title: "October",
      date: new Date(2024, 9, 1), // October 1, 2024
      items: [],
    })

    return sections
  }

  // Get all scheduled items (tasks and projects with due dates)
  const getScheduledItems = (): ScheduledItem[] => {
    const items: ScheduledItem[] = []

    // Add tasks with due dates
    allTasks.forEach((task) => {
      if (task.dueDate && isAfter(new Date(task.dueDate), currentDate)) {
        items.push({
          id: task.id,
          type: "task",
          content: task.content,
          checked: task.checked,
          dueDate: task.dueDate,
          tags: task.tags,
          flagged: task.flagged,
        })
      }
    })

    // Add projects with due dates
    Object.values(projects).forEach((project) => {
      if (project.whenDate && isAfter(new Date(project.whenDate), currentDate)) {
        items.push({
          id: project.id,
          type: "project",
          content: project.name,
          dueDate: project.whenDate,
          tags: project.tags,
          projectId: project.id,
        })
      }
    })

    return items
  }

  // Organize items into date sections
  const organizeItemsIntoSections = (): DateSection[] => {
    const sections = generateDateSections()
    const scheduledItems = getScheduledItems()

    scheduledItems.forEach((item) => {
      const itemDate = new Date(item.dueDate)
      let placed = false

      // Check specific date sections first
      for (const section of sections) {
        if (section.date && isSameDay(itemDate, section.date)) {
          section.items.push(item)
          placed = true
          break
        }
      }

      // Handle June 4-30 range
      if (!placed) {
        const june4 = new Date(2024, 5, 4) // June 4, 2024
        const june30 = new Date(2024, 5, 30) // June 30, 2024
        if (itemDate >= june4 && itemDate <= june30) {
          const juneSection = sections.find((s) => s.id === "june-rest")
          if (juneSection) {
            juneSection.items.push(item)
            placed = true
          }
        }
      }

      // Handle monthly sections
      if (!placed) {
        const itemMonth = getMonth(itemDate)
        const itemYear = getYear(itemDate)

        if (itemYear === 2024) {
          let monthSection: DateSection | undefined

          switch (itemMonth) {
            case 6: // July
              monthSection = sections.find((s) => s.id === "july")
              break
            case 7: // August
              monthSection = sections.find((s) => s.id === "august")
              break
            case 8: // September
              monthSection = sections.find((s) => s.id === "september")
              break
            case 9: // October
              monthSection = sections.find((s) => s.id === "october")
              break
          }

          if (monthSection) {
            monthSection.items.push(item)
          }
        }
      }
    })

    return sections
  }

  const dateSections = organizeItemsIntoSections()

  // Removed drag handlers - using global drag context instead

  const handleTaskSelect = (id: string, event: React.MouseEvent) => {
    if (editingId) return

    if (event.ctrlKey || event.metaKey) {
      setSelectedTaskIds((prev) => {
        const newSelection = new Set(prev)
        if (newSelection.has(id)) {
          newSelection.delete(id)
        } else {
          newSelection.add(id)
        }
        return newSelection
      })
    } else {
      setSelectedTaskIds(new Set([id]))
    }
  }

  const handleTaskExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId)
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-12 pt-12 pb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-red-500" />
            Upcoming
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {dateSections.reduce((total, section) => total + section.items.length, 0)} scheduled items
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="h-6 bg-gray-200 text-gray-700 text-xs px-2">
            All
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-gray-500 text-xs px-2">
            Freelancer
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-gray-500 text-xs px-2">
            TIME BASED...
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-gray-500 text-xs px-2">
            •••
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-12 pb-6">
        {/* Removed DndContext wrapper - using global drag context instead */}
        {dateSections.map((section) => (
          <DateSectionComponent
            key={section.id}
            section={section}
            currentDate={currentDate}
            onTaskSelect={handleTaskSelect}
            onTaskExpand={handleTaskExpand}
            selectedTaskIds={selectedTaskIds}
            expandedTaskId={expandedTaskId}
            editingId={editingId}
            setEditingId={setEditingId}
            onToggleTask={toggleTask}
          />
        ))}
      </div>
    </div>
  )
}

// Separate component for each date section
function DateSectionComponent({
  section,
  currentDate,
  onTaskSelect,
  onTaskExpand,
  selectedTaskIds,
  expandedTaskId,
  editingId,
  setEditingId,
  onToggleTask,
}: {
  section: DateSection
  currentDate: Date
  onTaskSelect: (id: string, event: React.MouseEvent) => void
  onTaskExpand: (taskId: string) => void
  selectedTaskIds: Set<string>
  expandedTaskId: string | null
  editingId: string | null
  setEditingId: (id: string | null) => void
  onToggleTask: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: section.id,
  })

  // Get the day number for display
  const getDayNumber = () => {
    if (section.date) {
      return format(section.date, "d")
    }
    return null
  }

  const dayNumber = getDayNumber()

  return (
    <div
      ref={setNodeRef}
      className={cn("mb-8 transition-colors rounded-lg", isOver && "bg-blue-50 border-2 border-blue-200")}
    >
      {/* Horizontal divider line - skip for first section */}

      {/* Date header - always show */}
      <div className="flex items-baseline gap-3 mb-4">
        {dayNumber && <span className="text-xl font-bold text-gray-900">{dayNumber}</span>}
        <div className="flex-1">
          {section.id !== "tomorrow" && <div className="w-full h-px bg-gray-200 mb-1"></div>}
          <h3 className="text-sm font-bold text-gray-600">{section.title}</h3>
        </div>
      </div>

      {/* Items - only show if there are items */}
      {section.items.length > 0 && (
        <div className="space-y-1">
          <SortableContext items={section.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {section.items.map((item) => (
              <div key={item.id}>
                {item.type === "task" ? (
                  <SortableTaskItem
                    id={item.id}
                    content={item.content}
                    checked={item.checked || false}
                    dueDate={item.dueDate}
                    flagged={item.flagged}
                    tags={item.tags}
                    onToggle={() => onToggleTask(item.id)}
                    onEdit={(newContent) => {
                      // Handle task editing
                      setEditingId(null)
                    }}
                    isEditing={editingId === item.id}
                    setEditing={() => setEditingId(item.id)}
                    isSelected={selectedTaskIds.has(item.id)}
                    isExpanded={expandedTaskId === item.id}
                    onExpand={() => onTaskExpand(item.id)}
                    onSelect={(e) => onTaskSelect(item.id, e)}
                  />
                ) : (
                  <ProjectItem
                    id={item.id}
                    content={item.content}
                    dueDate={item.dueDate}
                    tags={item.tags}
                    onSelect={(e) => onTaskSelect(item.id, e)}
                    isSelected={selectedTaskIds.has(item.id)}
                  />
                )}
              </div>
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  )
}

// Component for project items
function ProjectItem({
  id,
  content,
  dueDate,
  tags = [],
  onSelect,
  isSelected,
}: {
  id: string
  content: string
  dueDate: string
  tags?: string[]
  onSelect: (e: React.MouseEvent) => void
  isSelected: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 h-[34px] bg-background relative rounded-md transition-colors duration-200 cursor-pointer group",
        isSelected ? "bg-gray-100" : "hover:bg-gray-50",
      )}
      onClick={onSelect}
    >
      {/* Drag handle - appears on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing">
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" className="text-gray-400">
          <circle cx="2" cy="2" r="1" fill="currentColor" />
          <circle cx="6" cy="2" r="1" fill="currentColor" />
          <circle cx="2" cy="6" r="1" fill="currentColor" />
          <circle cx="6" cy="6" r="1" fill="currentColor" />
          <circle cx="2" cy="10" r="1" fill="currentColor" />
          <circle cx="6" cy="10" r="1" fill="currentColor" />
        </svg>
      </div>

      {/* Circle checkbox for projects */}
      <div className="flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 bg-white hover:border-gray-400 transition-colors">
        <Circle className="h-2 w-2 text-blue-500 fill-blue-500" />
      </div>

      {/* Project title (bold) */}
      <span className="flex-1 font-semibold text-[14px] text-[#0F172A] truncate">{content}</span>

      {/* Task count badge */}
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-gray-100 text-gray-600">
        0
      </Badge>

      {/* Tags */}
      <div className="flex gap-1 items-center">
        {tags.slice(0, 3).map((tag, index) => (
          <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0 h-4 truncate max-w-[60px]">
            {tag}
          </Badge>
        ))}
        {tags.length > 3 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            ...
          </Badge>
        )}
      </div>

      {/* Bottom divider line */}
      <div className="absolute bottom-0 left-4 right-4 h-[0.5px] bg-gray-200"></div>
    </div>
  )
}
