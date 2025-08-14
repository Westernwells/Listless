"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TaskItem, type TaskItemProps } from "./task-item"
import { GripVertical } from "lucide-react"
import { useState, useEffect } from "react"
import { useDragContext } from "./drag-context"

export interface SortableTaskItemProps extends TaskItemProps {
  isContextMenuOpen?: boolean
  isExpanded?: boolean
  onExpand?: () => void
}

export function SortableTaskItem(props: SortableTaskItemProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { selectedTaskIds, isMultiDragging, activeTaskId, dragType } = useDragContext()
  const isSelected = selectedTaskIds.has(props.id)

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
    // console.debug(`SortableTaskItem mounted`, { id: props.id })
  }, [])

  // Determine if this task is part of a multi-drag operation
  const isPartOfMultiDrag = isMultiDragging && isSelected

  // If this is not the active task but is part of a multi-drag, it should appear as being dragged
  const shouldAppearDragged = isPartOfMultiDrag && activeTaskId !== props.id

  // Use sortable hook for both sorting and cross-list dragging
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: props.id,
    data: {
      type: "sortable-task", // Always use sortable-task as the default type
      task: props,
      isSelected,
      isPartOfMultiDrag,
      selectedCount: selectedTaskIds.size,
    },
  })

  // Update dragging state
  useEffect(() => {
    setIsDragging(isSortableDragging || shouldAppearDragged)
  }, [isSortableDragging, shouldAppearDragged])

  // Use listeners and attributes only on client side
  const finalListeners = isClient ? {
    ...listeners,
    onClick: undefined, // Remove onClick to allow our own click handler to work
  } : {}

  const finalAttributes = isClient ? attributes : {}

  // Debug logging for listeners
  useEffect(() => {
    if (isClient && listeners) {
      // console.debug(`Task listeners`, { id: props.id, hasListeners: !!listeners, listenerKeys: Object.keys(listeners || {}) })
    }
  }, [isClient, listeners, attributes, props.id])

  // Create a style object
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : "auto",
    willChange: "transform",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group task-container transition-all duration-200 ease-out transform-gpu"
      data-dragging={isDragging ? "true" : "false"}
      data-selected={isSelected ? "true" : "false"}
      data-multi-drag={isPartOfMultiDrag ? "true" : "false"}
      data-expanded={props.isExpanded ? "true" : "false"}
    >
      {isClient && (
        <div className="grip-handle">
          <button
            className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            {...finalAttributes}
            {...finalListeners}
            onMouseDown={(e) => {
              // Intentionally quiet during drag to avoid console overhead
            }}
            aria-label="Drag to reorder"
            suppressHydrationWarning
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="task-item-wrapper">
        <TaskItem
          {...props}
          isDragging={isDragging}
          isExpanded={props.isExpanded}
          onExpand={props.onExpand}
          isSelected={isSelected}
        />
      </div>
    </div>
  )
}
