"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronRight, Star } from "lucide-react"
import { useTaskContext } from "./task/task-context"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Add imports for droppable functionality
import { useDroppable } from "@dnd-kit/core"
import { useDragContext } from "./task/drag-context"
import { cn } from "@/lib/utils"

// Custom styled Star icon with yellow fill
function StarredIcon() {
  return <Star className="h-3.5 w-3.5" fill="#FBFF84" stroke="black" />
}

interface WeeklySectionProps {
  weeklySection: {
    title: string
    isExpandable: boolean
    lists: {
      name: string
      url: string
    }[]
  }
}

export function WeeklySection({ weeklySection }: WeeklySectionProps) {
  const { activeListId } = useTaskContext()
  const [isOpen, setIsOpen] = useState(true)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { isDraggingTask } = useDragContext()
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationState, setAnimationState] = useState<"idle" | "expanding" | "collapsing">("idle")

  // Enhanced effect to handle drag state without animation conflicts
  useEffect(() => {
    if (isDraggingTask && !isOpen) {
      // Use a slight delay to prevent animation conflicts
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isDraggingTask, isOpen])

  const handleDoubleClick = (e: React.MouseEvent, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingItem(title)
    setEditValue(title)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setEditingItem(null)
    } else if (e.key === "Escape") {
      setEditingItem(null)
    }
  }

  const handleBlur = () => {
    setEditingItem(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!isAnimating) {
      setIsAnimating(true)
      setAnimationState(open ? "expanding" : "collapsing")
      setIsOpen(open)

      // Reset animation state after all items have animated
      const totalItems = weeklySection.lists.length
      const animationDuration = open ? 300 + totalItems * 60 : 350 + 60 // Base duration + staggered delays

      setTimeout(() => {
        setIsAnimating(false)
        setAnimationState("idle")
      }, animationDuration)
    }
  }

  return (
    <SidebarGroup className="py-0">
      <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="w-full">
        <div className="flex items-center px-2 pr-1">
          <SidebarGroupLabel className="flex-1">{weeklySection.title}</SidebarGroupLabel>
          <CollapsibleTrigger asChild>
            <button
              className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground mr-0.5"
              aria-label={isOpen ? "Collapse section" : "Expand section"}
            >
              <ChevronRight className={`h-4 w-4 chevron-enhanced ${isOpen ? "rotate-90" : ""}`} />
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="collapsible-content-enhanced">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0 pl-2">
              {weeklySection.lists.map((list, index) => (
                <div
                  key={list.name}
                  className={cn(
                    animationState === "expanding" && "list-item-fade-in",
                    animationState === "collapsing" && "list-item-fade-out",
                  )}
                >
                  <WeeklySectionItem
                    list={list}
                    editingItem={editingItem}
                    editValue={editValue}
                    inputRef={inputRef}
                    onDoubleClick={handleDoubleClick}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                  />
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  )
}

// Extract the list item into a separate component to properly use hooks
function WeeklySectionItem({
  list,
  editingItem,
  editValue,
  inputRef,
  onDoubleClick,
  onKeyDown,
  onBlur,
}: {
  list: { name: string; url: string }
  editingItem: string | null
  editValue: string
  inputRef: React.RefObject<HTMLInputElement>
  onDoubleClick: (e: React.MouseEvent, title: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onBlur: () => void
}) {
  const { setActiveListId, activeListId, getTasksForList } = useTaskContext()
  const { isDraggingTask } = useDragContext()
  const [isOver, setIsOver] = useState(false)
  const listId = list.name.toLowerCase().replace(/\s+/g, "-")

  const { setNodeRef, isOver: dndIsOver } = useDroppable({
    id: `sidebar-${listId}`,
  })

  // Update isOver state when dndIsOver changes
  useEffect(() => {
    setIsOver(dndIsOver)
  }, [dndIsOver])

  // Determine if this item should show drop indicator
  const showDropIndicator = isDraggingTask && isOver

  // Calculate incomplete task count for this list
  const tasks = getTasksForList(listId)
  const incompleteCount = tasks.filter((task) => !task.checked).length

  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (editingItem === list.name) return // Don't navigate when editing
    setActiveListId(listId)
  }

  return (
    <SidebarMenuItem
      className={cn("w-full relative", showDropIndicator && "bg-blue-100 rounded-md border-2 border-blue-400")}
      ref={setNodeRef}
      data-droppable-id={`sidebar-${listId}`}
    >
      <SidebarMenuButton
        asChild
        isActive={activeListId === listId}
        className={cn(
          "data-[active=true]:bg-[#e3e3e3] data-[active=true]:rounded-md hover:bg-[#ececec] hover:rounded-md w-full",
          showDropIndicator && "bg-blue-50",
        )}
      >
        <a href="#" className="flex items-center gap-2" onClick={handleItemClick}>
          <StarredIcon />
          {editingItem === list.name ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => e.stopPropagation()}
              onKeyDown={onKeyDown}
              onBlur={onBlur}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent border-none outline-none focus:ring-0"
            />
          ) : (
            <>
              <span onDoubleClick={(e) => onDoubleClick(e, list.name)}>{list.name}</span>
              {list.name.toLowerCase() !== "scheduled" && incompleteCount > 0 && (
                <span className="ml-auto text-xs text-muted-foreground font-medium tabular-nums">
                  {incompleteCount}
                </span>
              )}
            </>
          )}
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
