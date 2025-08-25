"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Flag, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { ExpandedTaskView } from "./expanded-task-view"
import { useTaskContext } from "./task-context"

export interface TaskItemProps {
  id: string
  content: string
  checked: boolean
  dueDate?: string
  flagged?: boolean
  tags?: string[]
  onToggle: () => void
  onEdit: (newContent: string) => void
  isDragging?: boolean
  isEditing?: boolean
  isSelected?: boolean
  isContextMenuOpen?: boolean
  isExpanded?: boolean
  onExpand?: () => void
  setEditing?: () => void
  onSelect?: (e: React.MouseEvent) => void
  className?: string
}

export function TaskItem({
  id,
  content,
  checked,
  dueDate,
  flagged = false,
  tags = [],
  onToggle,
  onEdit,
  isDragging = false,
  isEditing = false,
  isSelected = false,
  isContextMenuOpen = false,
  isExpanded = false,
  onExpand = () => {},
  setEditing = () => {},
  onSelect = () => {},
  className,
}: TaskItemProps) {
  const { updateTask } = useTaskContext()
  const [editValue, setEditValue] = useState(content)
  const inputRef = useRef<HTMLInputElement>(null)
  const taskRef = useRef<HTMLDivElement>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [localIsEditing, setLocalIsEditing] = useState(isEditing)

  // Maximum number of tags to display before showing ellipsis
  const MAX_VISIBLE_TAGS = 1

  // Update local editing state when prop changes
  useEffect(() => {
    setLocalIsEditing(isEditing)
  }, [isEditing])

  // Focus input when editing starts
  useEffect(() => {
    if (localIsEditing && inputRef.current) {
      inputRef.current.focus()

      // Position cursor at the end of text without selecting all text
      const length = inputRef.current.value.length
      inputRef.current.setSelectionRange(length, length)
    }
  }, [localIsEditing])

  // Update edit value when content changes
  useEffect(() => {
    setEditValue(content)
  }, [content])

  // Handle animation state when expanded state changes
  useEffect(() => {
    if (!isExpanded && isClosing) {
      // Set a timeout to match the animation duration (250ms)
      const timer = setTimeout(() => {
        setIsClosing(false)
      }, 250) // Match the animation duration in CSS
      return () => clearTimeout(timer)
    }

    // When task is expanded, set it to editing mode immediately for snappy response
    if (isExpanded && !isClosing) {
      setLocalIsEditing(true)
    }
  }, [isExpanded, isClosing])

  // Optimize event handlers with useCallback to prevent unnecessary re-renders
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isExpanded && !isClosing) {
      onExpand()
    } else if (setEditing) {
      setEditing()
    }
  }, [isExpanded, isClosing, onExpand, setEditing])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onEdit(editValue)
      setLocalIsEditing(false)
    } else if (e.key === "Escape") {
      setEditValue(content)
      onEdit(content)
      setLocalIsEditing(false)
    }
  }, [editValue, content, onEdit])

  const handleBlur = useCallback(() => {
    onEdit(editValue)
    // Only exit editing mode if not expanded
    if (!isExpanded) {
      setLocalIsEditing(false)
    }
  }, [editValue, onEdit, isExpanded])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (onSelect && !localIsEditing) {
      onSelect(e)
    }
  }, [onSelect, localIsEditing])

  const handleExpandToggle = useCallback(() => {
    if (isExpanded) {
      setIsClosing(true)
      setLocalIsEditing(false)
      // Trigger state change immediately - parent will handle timing
      onExpand()
    } else {
      onExpand()
    }
  }, [isExpanded, onExpand])

  // Handle content click for editing in expanded view only
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    // Only handle clicks when task is already expanded
    if (isExpanded) {
      // Prevent event propagation to avoid triggering selection
      e.stopPropagation()

      // Only allow editing in expanded view
      setLocalIsEditing(true)
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          // Position cursor at the end without selecting text
          const length = inputRef.current.value.length
          inputRef.current.setSelectionRange(length, length)
        }
      })
    }
    // If not expanded, let the click bubble up to trigger selection
  }, [isExpanded])

  // Determine which tags to display and if we need an ellipsis
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS)
  const hasMoreTags = tags.length > MAX_VISIBLE_TAGS

  return (
    <>
      {/* Render expanded view if task is expanded or closing */}
      {(isExpanded || isClosing) ? (
        <div className="overflow-visible">
          <ExpandedTaskView
            task={{
              id,
              content,
              checked,
              dueDate,
              flagged,
              tags,
              notes: "", // Add notes field
              priority: null, // Add priority field
              // Add any other properties needed
            }}
            onClose={handleExpandToggle}
            onToggleTask={onToggle}
            onUpdateTask={updateTask}
            isClosing={isClosing}
            onTitleChange={(newTitle) => {
              setEditValue(newTitle)
              onEdit(newTitle)
            }}
            isEditing={localIsEditing}
            setEditing={(value) => setLocalIsEditing(value)}
          />
        </div>
      ) : (
        /* Main task item - only render when not expanded */
        <div
          ref={taskRef}
          className={cn(
            "flex items-center gap-3 px-4 h-[34px] bg-background relative rounded-md transition-colors duration-200 task-item cursor-default",
            isDragging ? "task-dragging" : "",
            checked ? "opacity-70" : "",
            isSelected ? "task-selected" : "",
            isContextMenuOpen ? "bg-gray-300" : "", // Darker background when context menu is open
            className,
          )}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          tabIndex={0}
          role="listitem"
          aria-selected={isSelected}
          data-state={isSelected ? "selected" : ""}
          data-selected={isSelected ? "true" : "false"}
          data-context-menu={isContextMenuOpen ? "open" : "closed"}
          data-expanded="false"
          data-task-id={id}
          data-testid="task-item"
        >
          {/* Checkbox - no static drag handle */}
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              id={`task-${id}`}
              checked={checked}
              onCheckedChange={onToggle}
              aria-label={checked ? `Mark ${content} as incomplete` : `Mark ${content} as complete`}
              className="border-[#D5D6D9]"
            />
          </div>

          {localIsEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[14px] font-normal text-[#0F172A]"
              style={{ fontFamily: "Inter, sans-serif" }}
            />
          ) : (
            <div
              onClick={handleContentClick}
              className={cn(
                "flex-1 text-[14px] font-normal text-[#0F172A] truncate",
                checked && "line-through text-muted-foreground",
                "cursor-default",
              )}
              style={{ fontFamily: "Inter, sans-serif" }}
              title={content} // Show full content on hover
              data-testid="task-title"
            >
              {content}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {flagged && <Flag className="h-4 w-4 text-destructive flex-shrink-0" />}

            <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />

            <div className="flex gap-1 items-center">
              {visibleTags.map((tag, index) => (
                <Badge
                  key={typeof tag === 'string' ? index : tag.id}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 truncate max-w-[60px]"
                  style={{
                    borderColor: typeof tag === 'string' ? '#6366f1' : (tag.color || '#6366f1'),
                    color: typeof tag === 'string' ? '#6366f1' : (tag.color || '#6366f1')
                  }}
                  title={typeof tag === 'string' ? tag : tag.name} // Show full tag on hover
                >
                  {typeof tag === 'string' ? tag : tag.name}
                </Badge>
              ))}
              {hasMoreTags && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 min-w-[20px]"
                  title={tags.slice(MAX_VISIBLE_TAGS).map(tag => typeof tag === 'string' ? tag : tag.name).join(", ")} // Show remaining tags on hover
                >
                  ...
                </Badge>
              )}
            </div>
          </div>


        </div>
      )}
    </>
  )
}
