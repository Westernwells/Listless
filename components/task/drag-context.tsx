"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import dynamic from "next/dynamic"
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DragCancelEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDndMonitor,
  MeasuringStrategy,
  defaultDropAnimationSideEffects,
  closestCenter,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { useTaskContext } from "./task-context"
import { useTaskMovement, useBulkTaskMovement } from "@/hooks/use-task-movement"

type DragContextType = {
  activeTaskId: string | null
  selectedTaskIds: Set<string>
  isDraggingTask: boolean
  activeDroppableId: string | null
  isDraggingOver: (id: string) => boolean
  setSelectedTaskIds: (ids: Set<string>) => void
  isMultiDragging: boolean
  dragType: 'sorting' | 'cross-list' | null
  sortableItems: UniqueIdentifier[]
}

const DragContext = createContext<DragContextType>({
  activeTaskId: null,
  selectedTaskIds: new Set<string>(),
  isDraggingTask: false,
  activeDroppableId: null,
  isDraggingOver: () => false,
  setSelectedTaskIds: () => {},
  isMultiDragging: false,
  dragType: null,
  sortableItems: [],
})

export function useDragContext() {
  return useContext(DragContext)
}

// Monitor component to catch all drag events
function DragMonitor() {
  useDndMonitor({
    onDragStart(event) {
      console.log("🔍 MONITOR: onDragStart", event)
    },
    onDragMove(event) {
      console.log("🔍 MONITOR: onDragMove", event)
    },
    onDragOver(event) {
      console.log("🔍 MONITOR: onDragOver", event)
    },
    onDragEnd(event) {
      console.log("🔍 MONITOR: onDragEnd", event)
    },
    onDragCancel(event) {
      console.log("🔍 MONITOR: onDragCancel - DRAG WAS CANCELLED!", event)
    },
  })
  return null
}

export function DragContextProvider({ children }: { children: ReactNode }) {
  const { moveTasksToList, findTaskList, getTasksForList, activeListId } = useTaskContext()
  const taskMovement = useTaskMovement()
  const bulkTaskMovement = useBulkTaskMovement()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [selectedTaskIds, setSelectedTaskIdsInternal] = useState<Set<string>>(new Set())
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(null)
  const [droppableAreas, setDroppableAreas] = useState<Record<string, boolean>>({})
  const [isMultiDragging, setIsMultiDragging] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [dragType, setDragType] = useState<'sorting' | 'cross-list' | null>(null)
  const [sortableItems, setSortableItems] = useState<UniqueIdentifier[]>([])

  const setSelectedTaskIds = (ids: Set<string>) => {
    setSelectedTaskIdsInternal(ids)
  }

  // Default sensors without custom activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Add some debugging to the sensor
      onActivation: (event) => {
        console.log("🎯 SENSOR: PointerSensor activated", event)
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update sortable items when active list changes
  useEffect(() => {
    if (activeListId) {
      const tasks = getTasksForList(activeListId)
      const taskIds = tasks.map(task => task.id)
      setSortableItems(taskIds)
      console.log(`🎯 DRAG CONTEXT: Updated sortable items for list ${activeListId}:`, taskIds)
    }
  }, [activeListId, getTasksForList])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    console.log("🚀 DRAG START EVENT FIRED:", {
      activeId: active.id,
      activeData: active.data.current,
      timestamp: Date.now()
    })

    // Check if we're dragging a task by validating the drag data type or checking if it's in sortableItems
    const dragData = active.data.current
    const isTaskDrag = dragData?.type === "sortable-task" || sortableItems.includes(active.id)

    if (typeof active.id === "string" && isTaskDrag) {
      console.log("✅ Valid task drag detected, setting state...")
      setActiveTaskId(active.id)

      // Determine drag type based on the active element's data
      const isSortingDrag = dragData?.type === "sortable-task"
      setDragType(isSortingDrag ? 'sorting' : 'cross-list')

      // Check if we're dragging a selected task and there are multiple selections
      const isSelectedTask = selectedTaskIds.has(active.id)
      const isMultipleSelection = selectedTaskIds.size > 1

      setIsMultiDragging(isSelectedTask && isMultipleSelection)

      console.log("📊 Drag state set:", {
        taskId: active.id,
        dragType: isSortingDrag ? 'sorting' : 'cross-list',
        isSelected: isSelectedTask,
        multipleSelected: isMultipleSelection,
        isMultiDragging: isSelectedTask && isMultipleSelection,
        selectedTasks: Array.from(selectedTaskIds),
      })
    } else {
      console.log("❌ Invalid drag target:", active.id, "- not a task or not in sortable items")
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
    console.log("🏁 DRAG END EVENT FIRED:", {
      activeId: active?.id,
      overId: over?.id,
      activeTaskId,
      isMultiDragging,
      selectedTasks: Array.from(selectedTaskIds),
      timestamp: Date.now()
    })

    // Store current state before resetting
    const currentActiveTaskId = activeTaskId
    const currentDragType = dragType
    const currentIsMultiDragging = isMultiDragging

    // Reset state
    console.log("🔄 Resetting drag state...")
    setActiveTaskId(null)
    setActiveDroppableId(null)
    setDroppableAreas({})
    setIsMultiDragging(false)
    setDragType(null)

    // Handle sorting within the same list
    if (currentDragType === 'sorting' && currentActiveTaskId && over && typeof over.id === "string" && sortableItems.includes(over.id)) {
      const activeIndex = sortableItems.indexOf(currentActiveTaskId)
      const overIndex = sortableItems.indexOf(over.id)

      if (activeIndex !== overIndex && activeIndex !== -1 && overIndex !== -1) {
        const newItems = arrayMove(sortableItems, activeIndex, overIndex)
        setSortableItems(newItems)

        // TODO: Update task order in the backend
        console.log("Reordered tasks:", { from: activeIndex, to: overIndex, newOrder: newItems })
      }
    }
    // If we have an active task and it's dropped on a sidebar item (cross-list drag)
    if (currentActiveTaskId && over && typeof over.id === "string" && over.id.startsWith("sidebar-")) {
      const targetView = over.id.replace("sidebar-", "")
      const sourceListId = findTaskList(currentActiveTaskId)

      console.log("Moving task(s) to:", targetView, "from:", sourceListId)

      // Determine if this is a project drop
      const isProjectDrop = !['inbox', 'today', 'scheduled', 'deferred', 'completed', 'trash'].includes(targetView)
      const projectId = isProjectDrop ? targetView : undefined

      if (currentIsMultiDragging && selectedTaskIds.size > 1) {
        // Move all selected tasks using bulk movement
        const tasksToMove = Array.from(selectedTaskIds).map(taskId => ({
          taskId,
          targetView: isProjectDrop ? 'project' : targetView,
          projectId,
        }))

        console.log("Moving multiple tasks:", tasksToMove)
        try {
          bulkTaskMovement.mutate(tasksToMove, {
            onError: (error) => {
              console.error('❌ Bulk task movement failed:', error)
              // Don't let the error freeze the UI
            },
            onSuccess: () => {
              console.log('✅ Bulk task movement successful')
            }
          })
        } catch (error) {
          console.error('❌ Error initiating bulk task movement:', error)
        }
      } else {
        // Move single task
        console.log("Moving single task:", currentActiveTaskId, "to:", targetView)
        try {
          taskMovement.mutate({
            taskId: currentActiveTaskId,
            targetView: isProjectDrop ? 'project' : targetView,
            projectId,
          }, {
            onError: (error) => {
              console.error('❌ Task movement failed:', error)
              // Don't let the error freeze the UI
            },
            onSuccess: () => {
              console.log('✅ Task movement successful')
            }
          })
        } catch (error) {
          console.error('❌ Error initiating task movement:', error)
        }
      }

      // Clear selection after successful drop
      setSelectedTaskIdsInternal(new Set())
    }
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
          dragType: null,
          sortableItems: [],
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
        dragType,
        sortableItems,
      }}
    >
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always, // Always measure to improve accuracy
          },
        }}
        modifiers={[]} // Remove any modifiers that might cause lag
        // @ts-ignore - Type issue with dropAnimation
        dropAnimation={dropAnimation}
      >
        <DragMonitor />
        <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </DndContext>
    </DragContext.Provider>
  )
}
