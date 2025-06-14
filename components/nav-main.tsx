"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { LucideIcon } from "lucide-react"
import { useTaskContext } from "./task/task-context"
import { useDragContext } from "./task/drag-context"
import { useDroppable } from "@dnd-kit/core"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavMain({
  items = [],
}: {
  items?: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
  }[]
}) {
  const { setActiveListId, activeListId } = useTaskContext()
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingItem && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingItem])

  if (items.length === 0) return null

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

  return (
    <SidebarGroup className="py-0">
      <SidebarGroupContent>
        <SidebarMenu className="gap-0">
          {items.map((item) => (
            <NavMenuItem
              key={item.title}
              item={item}
              editingItem={editingItem}
              editValue={editValue}
              inputRef={inputRef}
              onDoubleClick={handleDoubleClick}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// Extract the menu item into a separate component to properly use hooks
function NavMenuItem({
  item,
  editingItem,
  editValue,
  inputRef,
  onDoubleClick,
  onKeyDown,
  onBlur,
}: {
  item: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
  }
  editingItem: string | null
  editValue: string
  inputRef: React.RefObject<HTMLInputElement>
  onDoubleClick: (e: React.MouseEvent, title: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onBlur: () => void
}) {
  const { setActiveListId, activeListId, getTasksForList } = useTaskContext()
  const { isDraggingTask, isDraggingOver } = useDragContext()
  const [isOver, setIsOver] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  const itemId = `sidebar-${item.title.toLowerCase()}`

  // Only call useDroppable on client side to prevent SSR issues
  const droppableResult = typeof window !== 'undefined' ? useDroppable({
    id: itemId,
  }) : { setNodeRef: () => {}, isOver: false }

  const { setNodeRef, isOver: dndIsOver } = isClient ? droppableResult : { setNodeRef: () => {}, isOver: false }

  // Update isOver state when dndIsOver changes
  useEffect(() => {
    setIsOver(dndIsOver)
  }, [dndIsOver])

  // Determine if this item should show drop indicator
  const showDropIndicator = isDraggingTask && isOver

  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (editingItem === item.title) return // Don't navigate when editing
    setActiveListId(item.title.toLowerCase())
  }

  // Calculate incomplete task count for this list
  const tasks = getTasksForList(item.title.toLowerCase())
  const incompleteCount = tasks.filter((task) => !task.checked).length

  return (
    <SidebarMenuItem
      className={cn("w-full relative", showDropIndicator && "bg-blue-100 rounded-md border-2 border-blue-400")}
      ref={isClient ? setNodeRef : undefined}
      data-droppable-id={itemId}
      suppressHydrationWarning
    >
      <SidebarMenuButton
        tooltip={item.title}
        asChild
        isActive={activeListId === item.title.toLowerCase()}
        className={cn(
          "data-[active=true]:bg-[#e3e3e3] data-[active=true]:rounded-md hover:bg-[#ececec] hover:rounded-md w-full",
          showDropIndicator && "bg-blue-50",
        )}
      >
        <a href="#" className="flex items-center gap-2" onClick={handleItemClick}>
          {item.icon && <item.icon />}
          {editingItem === item.title ? (
            <input
              ref={editingItem === item.title ? inputRef : undefined}
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
              <span onDoubleClick={(e) => onDoubleClick(e, item.title)}>{item.title}</span>
              {incompleteCount > 0 && (
                <span className="ml-auto text-xs text-muted-foreground font-medium">{incompleteCount}</span>
              )}
            </>
          )}
        </a>
      </SidebarMenuButton>

      {/* Visual indicator for drop target */}
      {showDropIndicator && <div className="absolute inset-0 pointer-events-none" />}
    </SidebarMenuItem>
  )
}
