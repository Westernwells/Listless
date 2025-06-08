"use client"

import { useSortable } from "@dnd-kit/sortable"
import { useDraggable } from "@dnd-kit/core"
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
  const { selectedTaskIds, isMultiDragging, activeTaskId } = useDragContext()
  const isSelected = selectedTaskIds.has(props.id)

  // Determine if this task is part of a multi-drag operation
  const isPartOfMultiDrag = isMultiDragging && isSelected

  // If this is not the active task but is part of a multi-drag, it should appear as being dragged
  const shouldAppearDragged = isPartOfMultiDrag && activeTaskId !== props.id

  // Local drag-and-drop for sorting within a list
  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef: setSortableNodeRef,
    transform: sortableTransform,
    transition: sortableTransition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: props.id,
    data: {
      type: "task",
      task: props,
      isSelected,
      isPartOfMultiDrag,
    },
  })

  // Global drag-and-drop for moving between lists
  const {
    attributes: draggableAttributes,
    listeners: draggableListeners,
    setNodeRef: setDraggableNodeRef,
    transform: draggableTransform,
    isDragging: isDraggableDragging,
  } = useDraggable({
    id: props.id,
    data: {
      type: "task",
      task: props,
      isSelected,
      isPartOfMultiDrag,
      selectedCount: selectedTaskIds.size,
    },
  })

  // Update combined dragging state
  useEffect(() => {
    setIsDragging(isSortableDragging || isDraggableDragging || shouldAppearDragged)
  }, [isSortableDragging, isDraggableDragging, shouldAppearDragged])

  // Combine the refs
  const setRefs = (node: HTMLElement | null) => {
    setSortableNodeRef(node)
    setDraggableNodeRef(node)
  }

  // Combine the listeners and attributes
  const combinedListeners = {
    ...sortableListeners,
    ...draggableListeners,
    onClick: undefined, // Remove onClick to allow our own click handler to work
  }

  const combinedAttributes = {
    ...sortableAttributes,
    ...draggableAttributes,
  }

  // Use sortable transform for local sorting, draggable transform for global dragging
  const transform = isDraggableDragging ? draggableTransform : sortableTransform

  // Create a style object without conflicting transition properties
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : sortableTransition, // Remove transition during drag
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : "auto",
    willChange: "transform", // Add will-change for performance optimization
  }

  return (
    <div
      ref={setRefs}
      style={style}
      className="relative group task-container transition-all duration-200 ease-out transform-gpu"
      data-dragging={isDragging ? "true" : "false"}
      data-selected={isSelected ? "true" : "false"}
      data-multi-drag={isPartOfMultiDrag ? "true" : "false"}
      data-expanded={props.isExpanded ? "true" : "false"}
    >
      <div className="grip-handle">
        <button
          className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...combinedAttributes}
          {...combinedListeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>
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
