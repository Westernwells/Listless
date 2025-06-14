"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import dynamic from "next/dynamic"
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useTaskContext } from "./task-context"

type DragContextType = {
  activeTaskId: string | null
  selectedTaskIds: Set<string>
  isDraggingTask: boolean
  activeDroppableId: string | null
  isDraggingOver: (id: string) => boolean
  setSelectedTaskIds: (ids: Set<string>) => void
  isMultiDragging: boolean
}

const DragContext = createContext<DragContextType>({
  activeTaskId: null,
  selectedTaskIds: new Set<string>(),
  isDraggingTask: false,
  activeDroppableId: null,
  isDraggingOver: () => false,
  setSelectedTaskIds: () => {},
  isMultiDragging: false,
})

export function useDragContext() {
  return useContext(DragContext)
}

export function DragContextProvider({ children }: { children: ReactNode }) {
  const { moveTasksToList, findTaskList } = useTaskContext()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(null)
  const [droppableAreas, setDroppableAreas] = useState<Record<string, boolean>>({})
  const [isMultiDragging, setIsMultiDragging] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Enhanced sensors with better activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced distance for easier activation
        tolerance: 5, // Added tolerance
        delay: 0, // No delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      setActiveTaskId(null)
      setActiveDroppableId(null)
      setDroppableAreas({})
      setIsMultiDragging(false)
    }
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    // Check if we're dragging a task (IDs start with "task-")
    if (typeof active.id === "string" && active.id.startsWith("task-")) {
      setActiveTaskId(active.id)

      // Check if we're dragging a selected task and there are multiple selections
      const isSelectedTask = selectedTaskIds.has(active.id)
      const isMultipleSelection = selectedTaskIds.size > 1

      setIsMultiDragging(isSelectedTask && isMultipleSelection)

      console.log("Drag started:", {
        taskId: active.id,
        isSelected: isSelectedTask,
        multipleSelected: isMultipleSelection,
        isMultiDragging: isSelectedTask && isMultipleSelection,
        selectedTasks: Array.from(selectedTaskIds),
      })
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event

    // Check if we're over a droppable sidebar item
    if (over && typeof over.id === "string" && over.id.startsWith("sidebar-")) {
      const targetId = over.id.replace("sidebar-", "")
      setActiveDroppableId(targetId)

      // Update droppable areas state for visual feedback
      setDroppableAreas((prev) => ({
        ...prev,
        [over.id]: true,
      }))

      console.log("Dragging over:", over.id)
    } else {
      setActiveDroppableId(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    console.log("Drag ended:", {
      active,
      over,
      isMultiDragging,
      selectedTasks: Array.from(selectedTaskIds),
    })

    // If we have an active task and it's dropped on a sidebar item
    if (activeTaskId && over && typeof over.id === "string" && over.id.startsWith("sidebar-")) {
      const targetListId = over.id.replace("sidebar-", "")
      const sourceListId = findTaskList(activeTaskId)

      // Only move if source and target are different
      if (sourceListId && sourceListId !== targetListId) {
        // If we're multi-dragging, move all selected tasks
        if (isMultiDragging && selectedTaskIds.size > 0) {
          console.log("Moving multiple tasks:", {
            taskIds: Array.from(selectedTaskIds),
            from: sourceListId,
            to: targetListId,
          })
          moveTasksToList(Array.from(selectedTaskIds), targetListId)
        } else {
          // Otherwise just move the active task
          console.log("Moving single task:", {
            taskId: activeTaskId,
            from: sourceListId,
            to: targetListId,
          })
          moveTasksToList([activeTaskId], targetListId)
        }
      }
    }

    // Reset state
    setActiveTaskId(null)
    setActiveDroppableId(null)
    setDroppableAreas({})
    setIsMultiDragging(false)
  }

  // Helper function to check if dragging over a specific area
  const isDraggingOver = (id: string): boolean => {
    const fullId = id.startsWith("sidebar-") ? id : `sidebar-${id}`
    return !!droppableAreas[fullId]
  }

  // Custom drop animation to maintain consistent size
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  }

  // Don't render DndContext on server to prevent hydration issues
  if (!isClient) {
    return (
      <DragContext.Provider
        value={{
          activeTaskId: null,
          selectedTaskIds: new Set(),
          isDraggingTask: false,
          activeDroppableId: null,
          isDraggingOver: () => false,
          setSelectedTaskIds: () => {},
          isMultiDragging: false,
        }}
      >
        {children}
      </DragContext.Provider>
    )
  }

  return (
    <DragContext.Provider
      value={{
        activeTaskId,
        selectedTaskIds,
        isDraggingTask: activeTaskId !== null,
        activeDroppableId,
        isDraggingOver,
        setSelectedTaskIds,
        isMultiDragging,
      }}
    >
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always, // Always measure to improve accuracy
          },
        }}
        modifiers={[]} // Remove any modifiers that might cause lag
        // @ts-ignore - Type issue with dropAnimation
        dropAnimation={dropAnimation}
      >
        {children}
      </DndContext>
    </DragContext.Provider>
  )
}
