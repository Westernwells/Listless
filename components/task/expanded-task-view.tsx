"use client"
import React, { useState, useEffect, useRef } from "react"

import { X, CalendarClock, Tag, Flag, Calendar } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  const priorityButtonRef = useRef<HTMLButtonElement>(null)
  const tagButtonRef = useRef<HTMLButtonElement>(null)

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
    // Convert tag names back to tag objects for consistency
    // Note: The TagSelectorPopover now handles direct database operations when taskId is provided
    // This callback is mainly for UI state management
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
    <>
      <div
        ref={containerRef}
        className={cn(
          "relative bg-white border border-gray-200 rounded-lg p-4 pt-3 mb-2 overflow-visible",
          "mx-4", // Add horizontal margin to match screenshot
          isClosing ? "animate-expanded-out" : "animate-expanded-in",
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

      {/* Checkbox and Title row - matching collapsed state positioning */}
      <div className="flex items-center gap-3 mb-3">
        <Checkbox
          checked={task.checked}
          onCheckedChange={() => onToggleTask(task.id)}
          className="flex-shrink-0 border-[#D5D6D9]"
          onClick={(e) => e.stopPropagation()}
        />

        <input
          ref={titleInputRef}
          type="text"
          value={task.content}
          onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setEditing && setEditing(false)
            } else if (e.key === "Escape") {
              setEditing && setEditing(false)
            }
          }}
          onBlur={() => setEditing && setEditing(false)}
          className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[14px] font-normal text-[#0F172A] placeholder-gray-400"
          style={{ fontFamily: "Inter, sans-serif" }}
          placeholder="Task title"
        />
      </div>

      {/* Notes section - explicitly NOT auto-focused */}
      <Textarea
        ref={notesRef}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Description"
        className="min-h-[80px] mb-3 resize-none border-none bg-transparent text-[14px] focus-visible:ring-0 p-0 text-gray-600 placeholder-gray-400 ml-7"
        autoFocus={false} // Explicitly prevent auto-focus
        tabIndex={0} // Ensure it's tabbable but not auto-focused
      />

      {/* Information display area */}
      <div className="mb-2 space-y-2 ml-7">
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

      {/* Action buttons row - compact layout */}
      <div className="flex items-center justify-between pt-1 mt-1">
        <div className="flex items-center gap-1">
          {/* Date button */}
          <Button
            variant="ghost"
            size="xs"
            className="h-6 px-2 text-xs text-gray-600 hover:bg-gray-50"
            onClick={(e) => handleOpenDatePicker("due", e)}
          >
            <Calendar className="h-3 w-3 mr-0.5" />
            Date
          </Button>

          {/* Priority button */}
          <Button
            ref={priorityButtonRef}
            variant="ghost"
            size="xs"
            className="h-6 px-2 text-xs text-gray-600 hover:bg-gray-50"
            onClick={() => setIsPrioritySelectorOpen(true)}
          >
            <Flag className="h-3 w-3 mr-0.5" />
            Priority
          </Button>

          {/* Tags button (renamed from Reminders) */}
          <Button
            ref={tagButtonRef}
            variant="ghost"
            size="xs"
            className="h-6 px-2 text-xs text-gray-600 hover:bg-gray-50"
            onClick={() => setIsTagSelectorOpen(true)}
          >
            <Tag className="h-3 w-3 mr-0.5" />
            Tags
          </Button>

          {/* More options button */}
          <Button
            variant="ghost"
            size="xs"
            className="h-6 px-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            •••
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* Cancel button */}
          <Button
            variant="ghost"
            size="xs"
            className="h-6 px-2 text-xs text-gray-600 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </Button>

          {/* Save button (renamed from Add task, changed to purple) */}
          <Button
            size="xs"
            className="h-6 px-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onClose}
          >
            Save
          </Button>
        </div>
      </div>
      </div>

      {/* Dialogs rendered outside the animated container to avoid transform stacking context issues */}
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
        selectedTags={task.tags?.map(tag => typeof tag === 'string' ? tag : tag.name) || []}
        onTagsChange={handleTagsChange}
        triggerElement={tagButtonRef.current}
        taskId={task.id}
      />

      {/* Priority selector */}
      <PrioritySelector
        open={isPrioritySelectorOpen}
        onOpenChange={setIsPrioritySelectorOpen}
        selectedPriority={task.priority}
        onPriorityChange={handlePriorityChange}
        triggerElement={priorityButtonRef.current}
      />
    </>
  )
}
