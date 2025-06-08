"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { X, CalendarClock, Tag, Flag, Calendar } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Task } from "./task-context"
import { TagSelectorPopover } from "./tag-selector-popover"
import { PrioritySelector } from "./priority-selector"
import { ModelessDatePicker } from "./modeless-date-picker"

interface ExpandedTaskViewProps {
  task: Task
  onClose: () => void
  onToggleTask: (id: string) => void
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  className?: string
  isClosing?: boolean
  onTitleChange?: (newTitle: string) => void
  isEditing?: boolean
  setEditing?: (value: boolean) => void
}

export function ExpandedTaskView({
  task,
  onClose,
  onToggleTask,
  onUpdateTask,
  className,
  isClosing = false,
  onTitleChange,
  isEditing = false,
  setEditing,
}: ExpandedTaskViewProps) {
  const [notes, setNotes] = useState(task.notes || "")
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false)
  const [isPrioritySelectorOpen, setIsPrioritySelectorOpen] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<"defer" | "due" | null>(null)
  const [datePickerPosition, setDatePickerPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Handle click outside to close the expanded view
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Update task when notes change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (notes !== (task.notes || "")) {
        onUpdateTask(task.id, { notes })
      }
    }, 500) // Debounce updates

    return () => clearTimeout(timeoutId)
  }, [notes, task.id, task.notes, onUpdateTask])

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus()
      // Position cursor at the end of text
      const length = titleInputRef.current.value.length
      titleInputRef.current.setSelectionRange(length, length)
    }
  }, [isEditing])

  // Format dates for display
  const formatDate = (dateString: string | undefined, prefix = "") => {
    if (!dateString) return null
    const date = new Date(dateString)
    return `${prefix}${format(date, "EEE, MMM d")}`
  }

  // Calculate days left for due date
  const getDaysLeft = (dateString: string | undefined) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const today = new Date()
    const daysLeft = differenceInDays(date, today)
    return daysLeft === 1 ? "1 day left" : `${daysLeft} days left`
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isDatePickerOpen) {
      const dateString = format(date, "yyyy-MM-dd")
      onUpdateTask(task.id, { [isDatePickerOpen === "defer" ? "deferDate" : "dueDate"]: dateString })
      setIsDatePickerOpen(null)
    }
  }

  // Handle tag selection
  const handleTagsChange = (tags: string[]) => {
    onUpdateTask(task.id, { tags })
    setIsTagSelectorOpen(false)
  }

  // Handle priority selection
  const handlePriorityChange = (priority: string | null) => {
    onUpdateTask(task.id, { priority })
    setIsPrioritySelectorOpen(false)
  }

  // Handle opening date picker
  const handleOpenDatePicker = (type: "defer" | "due", event: React.MouseEvent) => {
    // Get button position for date picker
    const buttonRect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    setDatePickerPosition({
      x: buttonRect.left,
      y: buttonRect.bottom + window.scrollY,
    })
    setIsDatePickerOpen(type)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-white rounded-lg shadow-md p-4 pt-6 mb-2 overflow-hidden",
        isClosing ? "animate-drawer-out" : "animate-drawer-in",
        "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        className,
      )}
      data-state={isClosing ? "closing" : "open"}
      data-expanded="true"
    >
      {/* Close button */}
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 rounded-full" onClick={onClose}>
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>

      {/* Title input - only visible in expanded view */}
      {isEditing && setEditing && (
        <input
          ref={titleInputRef}
          type="text"
          value={task.content}
          onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setEditing(false)
            } else if (e.key === "Escape") {
              setEditing(false)
            }
          }}
          onBlur={() => setEditing(false)}
          className="w-full mb-2 bg-transparent border-none outline-none focus:ring-0 text-[16px] font-medium text-[#0F172A]"
          style={{ fontFamily: "Inter, sans-serif" }}
        />
      )}

      {/* Notes section - explicitly NOT auto-focused */}
      <Textarea
        ref={notesRef}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        className="min-h-[100px] mb-4 resize-none border-none bg-transparent text-[14px] focus-visible:ring-0 p-0 mt-2 expanded-notes"
        autoFocus={false} // Explicitly prevent auto-focus
        tabIndex={0} // Ensure it's tabbable but not auto-focused
      />

      {/* Information display area */}
      <div className="mb-4 space-y-2">
        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="bg-[#e8f5e9] text-[#2e7d32] border-none">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Defer date */}
        {task.deferDate && (
          <div className="flex items-center text-sm text-gray-600">
            <CalendarClock className="h-4 w-4 mr-2 text-red-500" />
            {formatDate(task.deferDate)}
          </div>
        )}

        {/* Due date */}
        {task.dueDate && (
          <div className="flex items-center text-sm text-gray-600">
            <Flag className="h-4 w-4 mr-2 text-blue-500" />
            <span>Deadline: {formatDate(task.dueDate)}</span>
            {getDaysLeft(task.dueDate) && <span className="ml-2 text-gray-400">{getDaysLeft(task.dueDate)}</span>}
          </div>
        )}
      </div>

      {/* Action icons row */}
      <div className="flex justify-end gap-2">
        <TooltipProvider>
          {/* Defer date icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleOpenDatePicker("defer", e)}>
                <CalendarClock className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>When</p>
            </TooltipContent>
          </Tooltip>

          {/* Due date icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleOpenDatePicker("due", e)}>
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Set Due Date</p>
            </TooltipContent>
          </Tooltip>

          {/* Tag icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsTagSelectorOpen(true)}>
                <Tag className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Tags</p>
            </TooltipContent>
          </Tooltip>

          {/* Priority flag icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPrioritySelectorOpen(true)}>
                <Flag className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Set Priority</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Date picker */}
      {isDatePickerOpen && (
        <ModelessDatePicker
          open={isDatePickerOpen !== null}
          onClose={() => setIsDatePickerOpen(null)}
          onSelect={handleDateSelect}
          title={isDatePickerOpen === "defer" ? "Defer Until" : "Set Due Date"}
          position={datePickerPosition}
          initialDate={
            isDatePickerOpen === "defer"
              ? task.deferDate
                ? new Date(task.deferDate)
                : undefined
              : task.dueDate
                ? new Date(task.dueDate)
                : undefined
          }
        />
      )}

      {/* Tag selector popover */}
      <TagSelectorPopover
        open={isTagSelectorOpen}
        onOpenChange={setIsTagSelectorOpen}
        selectedTags={task.tags || []}
        onTagsChange={handleTagsChange}
      />

      {/* Priority selector */}
      <PrioritySelector
        open={isPrioritySelectorOpen}
        onOpenChange={setIsPrioritySelectorOpen}
        selectedPriority={task.priority}
        onPriorityChange={handlePriorityChange}
      />
    </div>
  )
}
