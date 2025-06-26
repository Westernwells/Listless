"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { createPortal } from "react-dom"
import { TaskItem } from "./task-item"
import { SortableTaskItem } from "./sortable-task-item"
import {
  Plus,
  Calendar,
  Tag,
  Clock,
  Check,
  Copy,
  Trash,
  ArrowRightLeft,
  Share2,
  Inbox,
  Search,
  ListFilter,
  Undo2,
  Redo2,
  CircleCheckBig,
  CirclePause,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu"
import { useTaskContext } from "./task-context"
import { useDragContext } from "./drag-context"
import { TagSelectorDialog } from "./tag-selector-dialog"
import { ModelessDatePicker } from "./modeless-date-picker"
import { TaskConversionDialog } from "./task-conversion-dialog"
import { TaskSharingDialog } from "./task-sharing-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { taskService, type FrontendTask } from "@/lib/api/task-service"
import { useTasks, useInboxTasks, useTodayTasks, useDeferredTasks, useCompletedTasks, useProjectTasks, useCreateTask, useUpdateTask, useToggleTask, useDeleteTask, Task } from "@/hooks/use-tasks"

interface TaskListProps {
  initialTasks: Task[]
  title?: string
  showHeader?: boolean
  view?: 'inbox' | 'today' | 'deferred' | 'completed' | 'project'
  projectId?: string
}

// Create a special ID for the bottom drop area
const BOTTOM_DROP_AREA_ID = "bottom-drop-area"

// Bottom drop area component that integrates with DnD Kit
function BottomDropArea() {
  const { setNodeRef, isOver } = useDroppable({
    id: BOTTOM_DROP_AREA_ID,
  })

  return (
    <div
      ref={setNodeRef}
      className={`h-16 w-full transition-colors rounded-md my-4 mx-8 ${
        isOver ? "bg-gray-100 border-2 border-dashed border-gray-300" : ""
      }`}
      data-bottom-drop-area
    />
  )
}

export function TaskList({ initialTasks, title = "Tasks", showHeader = true, view, projectId }: TaskListProps) {
  const { duplicateTask, updateTaskDueDate, deleteTask, setTaskTags } = useTaskContext()
  const { selectedTaskIds, setSelectedTaskIds, isMultiDragging } = useDragContext()

  // TanStack Query hooks for optimized task management - use appropriate hook based on view
  const getTasksQuery = () => {
    switch (view) {
      case 'inbox':
        return useInboxTasks()
      case 'today':
        return useTodayTasks()
      case 'deferred':
        return useDeferredTasks()
      case 'completed':
        return useCompletedTasks()
      case 'project':
        return useProjectTasks(projectId || '')
      default:
        return useTasks()
    }
  }

  // Use initialTasks if provided, otherwise fetch from query
  const queryResult = getTasksQuery()
  const { data: queryTasks = [], isLoading: queryLoading, error: queryError } = queryResult

  // Use initialTasks if provided and not empty, otherwise use query data
  const tasks = initialTasks.length > 0 ? initialTasks : queryTasks
  const isLoading = initialTasks.length > 0 ? false : queryLoading
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const toggleTaskMutation = useToggleTask()
  const deleteTaskMutation = useDeleteTask()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [contextMenuTaskId, setContextMenuTaskId] = useState<string | null>(null)
  const [tagSelectorOpen, setTagSelectorOpen] = useState(false)
  const [selectedTaskTags, setSelectedTaskTags] = useState<string[]>([])
  const [isConversionDialogOpen, setIsConversionDialogOpen] = useState(false)
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false)
  const lastSelectedRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [closingTaskId, setClosingTaskId] = useState<string | null>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Convert query error to string for display
  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const error = queryError?.message && queryError.message !== dismissedError ? queryError.message : null

  // Date picker state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [datePickerAction, setDatePickerAction] = useState<"dueDate" | "defer">("dueDate")
  const [datePickerPosition, setDatePickerPosition] = useState({ x: 0, y: 0 })

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Measure container width for consistent drag overlay sizing
  useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.getBoundingClientRect().width
          setContainerWidth(width)
        }
      }

      updateWidth()
      // Use passive listener for better performance
      window.addEventListener("resize", updateWidth, { passive: true })
      return () => window.removeEventListener("resize", updateWidth)
    }
  }, [])

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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when editing
      if (editingId) return

      // Select all tasks with Ctrl/Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault()
        setSelectedTaskIds(new Set(tasks.map((task) => task.id)))
      }

      // Delete selected tasks with Delete key
      if (e.key === "Delete" && selectedTaskIds.size > 0) {
        e.preventDefault()
        handleContextMenuAction("delete")
      }

      // Mark selected tasks as complete with Ctrl/Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && selectedTaskIds.size > 0) {
        e.preventDefault()
        handleContextMenuAction("complete")
      }

      // Add task with Space key when not editing
      if (e.key === " " && !editingId && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault()
        handleAddTask()
      }

      // Expand task with Enter key when a task is selected
      if (e.key === "Enter" && selectedTaskIds.size === 1 && !editingId) {
        e.preventDefault()
        const taskId = Array.from(selectedTaskIds)[0]
        handleTaskExpand(taskId)
      }
    }

    // Use passive: false only when we need to preventDefault
    window.addEventListener("keydown", handleKeyDown, { passive: false })
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [tasks, selectedTaskIds, editingId, expandedTaskId, setSelectedTaskIds])

  // Handle closing animation completion
  useEffect(() => {
    if (closingTaskId) {
      const timer = setTimeout(() => {
        setExpandedTaskId(null)
        setClosingTaskId(null)
      }, 500) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [closingTaskId])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)

    // If dragging a selected task, all selected tasks should move
    if (selectedTaskIds.has(event.active.id as string)) {
      // We'll handle this in handleDragEnd
      console.log("Dragging a selected task. Selected tasks:", Array.from(selectedTaskIds))
    } else {
      // If dragging an unselected task, deselect all and select only this one
      setSelectedTaskIds(new Set([event.active.id as string]))
      console.log("Dragging an unselected task. Selecting only:", event.active.id)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    console.log("Drag end:", { active, over, selectedTaskIds: Array.from(selectedTaskIds) })

    // TODO: Implement drag and drop with TanStack Query
    // For now, we'll disable drag and drop functionality to prevent errors
    // This will be implemented in a future update with proper task reordering API

    console.log("Drag and drop temporarily disabled - will be re-implemented with TanStack Query")
    setActiveId(null)
  }

  const handleToggleTask = (id: string) => {
    const currentTask = tasks.find(task => task.id === id)
    if (!currentTask) return

    const newCheckedState = !currentTask.checked
    toggleTaskMutation.mutate({ id, completed: newCheckedState })
  }

  const handleTaskSelect = (id: string, event: React.MouseEvent) => {
    // Don't select when editing
    if (editingId) return

    // Handle shift+click for range selection
    if (event.shiftKey && lastSelectedRef.current) {
      const taskIds = tasks.map((task) => task.id)
      const currentIndex = taskIds.indexOf(id)
      const lastIndex = taskIds.indexOf(lastSelectedRef.current)

      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex)
        const end = Math.max(currentIndex, lastIndex)

        const rangeIds = taskIds.slice(start, end + 1)

        setSelectedTaskIds((prev) => {
          const newSelection = new Set(prev)
          rangeIds.forEach((id) => newSelection.add(id))
          return newSelection
        })

        console.log("Shift-click selection:", {
          range: rangeIds,
          from: lastSelectedRef.current,
          to: id,
        })
      }
    }
    // Handle ctrl/cmd+click for toggling selection
    else if (event.ctrlKey || event.metaKey) {
      setSelectedTaskIds((prev) => {
        const newSelection = new Set(prev)
        if (newSelection.has(id)) {
          newSelection.delete(id)
        } else {
          newSelection.add(id)
        }
        return newSelection
      })

      console.log("Ctrl/Cmd-click selection toggle:", id)
    }
    // Regular click - select only this task
    else {
      setSelectedTaskIds(new Set([id]))
      console.log("Single selection:", id)
    }

    lastSelectedRef.current = id
  }

  const handleContextMenuOpen = (taskId: string, event: React.MouseEvent) => {
    // Set the task that opened the context menu
    setContextMenuTaskId(taskId)

    // Make sure the task is selected
    if (!selectedTaskIds.has(taskId)) {
      setSelectedTaskIds(new Set([taskId]))
    }

    // Store the position for the date picker
    setDatePickerPosition({ x: event.clientX, y: event.clientY })
  }

  const handleContextMenuClose = () => {
    // Clear the context menu task when the menu closes
    setContextMenuTaskId(null)
  }

  const handleContextMenuAction = async (action: string) => {
    // Use requestIdleCallback for better performance if available
    const executeAction = (callback: () => void) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(callback)
      } else {
        // Fallback to setTimeout for browsers without requestIdleCallback
        setTimeout(callback, 0)
      }
    }

    switch (action) {
      case "delete":
        executeAction(() => {
          // Delete selected tasks using TanStack Query mutations
          const tasksToDelete = Array.from(selectedTaskIds)
          setSelectedTaskIds(new Set())

          // Delete each task using the mutation (with optimistic updates)
          tasksToDelete.forEach(taskId => {
            deleteTaskMutation.mutate(taskId)
          })
        })
        break
      case "complete":
        executeAction(() => {
          // Complete selected tasks using TanStack Query mutations
          const tasksToComplete = Array.from(selectedTaskIds)

          // Complete each task using the mutation (with optimistic updates)
          tasksToComplete.forEach(taskId => {
            toggleTaskMutation.mutate({ id: taskId, completed: true })
          })
        })
        break
      case "duplicate":
        executeAction(() => {
          // Use the duplicateTask function from context
          if (selectedTaskIds.size > 0) {
            selectedTaskIds.forEach((id) => {
              duplicateTask(id)
            })
          }
        })
        break
      case "setDueDate":
        // Close the context menu
        setContextMenuTaskId(null)
        // Set the date picker action and open it
        setDatePickerAction("dueDate")
        setIsDatePickerOpen(true)
        break
      case "defer":
        // Close the context menu
        setContextMenuTaskId(null)
        // Set the date picker action and open it
        setDatePickerAction("defer")
        setIsDatePickerOpen(true)
        break
      case "setTags":
        // Get tags from the first selected task
        if (selectedTaskIds.size > 0) {
          const firstTaskId = Array.from(selectedTaskIds)[0]
          const task = tasks.find((t) => t.id === firstTaskId)
          setSelectedTaskTags(task?.tags || [])
          setTagSelectorOpen(true)
        }
        break
      case "convertToProject":
        if (selectedTaskIds.size === 1) {
          setIsConversionDialogOpen(true)
        }
        break
      case "shareTask":
        if (selectedTaskIds.size === 1) {
          setIsSharingDialogOpen(true)
        }
        break
      default:
        break
    }
  }

  const handleAddTask = () => {
    // Generate a unique temporary ID for this task creation
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Immediately set the temporary task to editing mode for instant feedback
    setEditingId(tempId)

    // Prepare task data based on current view
    const getTaskDataForView = () => {
      const baseTaskData = {
        tempId, // Pass the tempId to ensure consistency
        content: "New Task",
        checked: false,
        flagged: false,
        tags: ["New"],
        priority: "medium" as const
      }

      switch (view) {
        case 'today':
          // For Today view, set due date to end of today to avoid "past date" constraint
          const endOfToday = new Date()
          endOfToday.setHours(23, 59, 59, 999)
          return {
            ...baseTaskData,
            dueDate: endOfToday.toISOString()
          }
        case 'project':
          // For Project view, assign to the current project
          return {
            ...baseTaskData,
            project_list_id: projectId
          }
        case 'inbox':
        case 'deferred':
        default:
          // For Inbox and other views, use base data (no project, no due date)
          return baseTaskData
      }
    }

    createTaskMutation.mutate(getTaskDataForView(), {
      onSuccess: (data) => {
        // If the temporary task is still being edited, switch to the real task ID
        if (editingId === tempId) {
          setEditingId(data.id)
        }
      },
      onError: () => {
        // If the task creation failed and we're still editing the temp task, clear editing
        if (editingId === tempId) {
          setEditingId(null)
        }
      }
    })
  }

  const handleTaskExpand = (taskId: string) => {
    if (expandedTaskId === taskId) {
      // Start closing animation
      setClosingTaskId(taskId)
      // Immediately update the expanded state for a more responsive feel
      setExpandedTaskId(null)
    } else {
      // If another task is expanded, close it first
      if (expandedTaskId) {
        setClosingTaskId(expandedTaskId)
        // Immediately expand the new task for a more responsive feel
        setExpandedTaskId(taskId)
      } else {
        // No task is expanded, expand this one immediately
        setExpandedTaskId(taskId)
      }
    }
  }

  const handleDateSelected = (date: Date) => {
    // Format the date as YYYY-MM-DD
    const formattedDate = format(date, "yyyy-MM-dd")

    // Update due dates for all selected tasks
    selectedTaskIds.forEach((id) => {
      if (datePickerAction === "dueDate") {
        updateTaskDueDate(id, formattedDate)
      } else {
        // Handle defer date (assuming updateTaskDeferDate exists)
        // If not, you might need to create this function in your task context
        const task = tasks.find((t) => t.id === id)
        if (task) {
          const updatedTask = { ...task, deferDate: formattedDate }
          // Update the task with the defer date
          // This depends on your implementation
        }
      }
    })

    // Close the date picker
    setIsDatePickerOpen(false)
  }

  const handleTagsSelected = (tags: string[]) => {
    // Update tags for all selected tasks
    selectedTaskIds.forEach((id) => {
      setTaskTags(id, tags)
    })
    setTagSelectorOpen(false)
  }

  const handleEditTask = (id: string, newContent: string) => {
    setEditingId(null)
    updateTaskMutation.mutate({ id, updates: { content: newContent } })
  }

  // Create a list of sortable items that includes the bottom drop area
  const sortableItems = [...tasks.map((task) => task.id), BOTTOM_DROP_AREA_ID]

  return (
    <div className="flex flex-col h-full relative" ref={containerRef}>
      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <div className="text-red-800 text-sm">
              {error}
            </div>
            <button
              onClick={() => setDismissedError(error)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showHeader && (
        <div className="flex items-center justify-between px-12 pt-12 pb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {title === "Inbox" && <Inbox className="h-5 w-5 text-muted-foreground" />}
              {title === "Today" && <Calendar className="h-5 w-5 text-muted-foreground" />}
              {title === "Deferred" && <CirclePause className="h-5 w-5 text-muted-foreground" />}
              {title === "Completed" && <CircleCheckBig className="h-5 w-5 text-muted-foreground" />}
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {tasks.filter((task) => !task.checked).length} tasks remaining
            </p>
          </div>
          <div className="flex items-center gap-4">
            {selectedTaskIds.size > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? "s" : ""} selected
              </div>
            )}
            <div className="flex items-center gap-3">
              <Search className="h-[18px] w-[18px] text-foreground/80 cursor-pointer hover:text-foreground transition-colors" />
              <ListFilter className="h-[18px] w-[18px] text-foreground/80 cursor-pointer hover:text-foreground transition-colors" />
              <Undo2 className="h-[18px] w-[18px] text-foreground/80 cursor-pointer hover:text-foreground transition-colors" />
              <Redo2 className="h-[18px] w-[18px] text-foreground/80 cursor-pointer hover:text-foreground transition-colors" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto w-full task-list-container pl-8 pt-4">
        <TaskListContent
          isClient={isClient}
          tasks={tasks}
          sensors={sensors}
          sortableItems={sortableItems}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleContextMenuClose={handleContextMenuClose}
          handleContextMenuOpen={handleContextMenuOpen}
          handleToggleTask={handleToggleTask}
          handleEditTask={handleEditTask}
          handleTaskExpand={handleTaskExpand}
          handleTaskSelect={handleTaskSelect}
          handleContextMenuAction={handleContextMenuAction}
          editingId={editingId}
          setEditingId={setEditingId}
          selectedTaskIds={selectedTaskIds}
          contextMenuTaskId={contextMenuTaskId}
          expandedTaskId={expandedTaskId}
          activeId={activeId}
          isMultiDragging={isMultiDragging}
        />
      </div>

      {/* Modeless Date Picker */}
      <ModelessDatePicker
        open={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelect={handleDateSelected}
        title={datePickerAction === "dueDate" ? "Set Due Date" : "Defer Until"}
        position={datePickerPosition}
      />

      {/* Floating Add Task button with tooltip - Hidden in completed view */}
      {view !== 'completed' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="absolute bottom-6 right-6 bg-black text-white rounded-[6px] hover:bg-black/90 px-4"
                onClick={handleAddTask}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Add a new task (Space)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Tag Selector Dialog */}
      <TagSelectorDialog
        open={tagSelectorOpen}
        onOpenChange={setTagSelectorOpen}
        onSave={handleTagsSelected}
        initialTags={selectedTaskTags}
      />

      {/* Task Conversion Dialog */}
      {contextMenuTaskId && (
        <TaskConversionDialog
          open={isConversionDialogOpen}
          onOpenChange={setIsConversionDialogOpen}
          taskId={contextMenuTaskId}
        />
      )}

      {/* Task Sharing Dialog */}
      {contextMenuTaskId && (
        <TaskSharingDialog
          open={isSharingDialogOpen}
          onOpenChange={setIsSharingDialogOpen}
          taskId={contextMenuTaskId}
        />
      )}
    </div>
  )
}

// Separate component for task list content to handle client/server rendering
function TaskListContent({
  isClient,
  tasks,
  sensors,
  sortableItems,
  handleDragStart,
  handleDragEnd,
  handleContextMenuClose,
  handleContextMenuOpen,
  handleToggleTask,
  handleEditTask,
  handleTaskExpand,
  handleTaskSelect,
  handleContextMenuAction,
  editingId,
  setEditingId,
  selectedTaskIds,
  contextMenuTaskId,
  expandedTaskId,
  activeId,
  isMultiDragging,
}: {
  isClient: boolean
  tasks: Task[]
  sensors: any
  sortableItems: string[]
  handleDragStart: (event: DragStartEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleContextMenuClose: () => void
  handleContextMenuOpen: (taskId: string, event: React.MouseEvent) => void
  handleToggleTask: (id: string) => void
  handleEditTask: (id: string, newContent: string) => void
  handleTaskExpand: (taskId: string) => void
  handleTaskSelect: (id: string, event: React.MouseEvent) => void
  handleContextMenuAction: (action: string) => void
  editingId: string | null
  setEditingId: (id: string) => void
  selectedTaskIds: Set<string>
  contextMenuTaskId: string | null
  expandedTaskId: string | null
  activeId: string | null
  isMultiDragging: boolean
}) {
  if (!isClient) {
    // Server-side fallback without drag and drop
    return (
      <div className="w-full">
        {tasks.map((task) => (
          <ContextMenu
            key={task.id}
            onOpenChange={(open) => {
              if (!open) handleContextMenuClose()
            }}
          >
            <ContextMenuTrigger onContextMenu={(e) => handleContextMenuOpen(task.id, e)}>
              <TaskItem
                id={task.id}
                content={task.content}
                checked={task.checked}
                dueDate={task.dueDate}
                flagged={task.flagged}
                tags={task.tags}
                onToggle={() => handleToggleTask(task.id)}
                onEdit={(newContent) => handleEditTask(task.id, newContent)}
                isEditing={editingId === task.id}
                setEditing={() => setEditingId(task.id)}
                isSelected={selectedTaskIds.has(task.id)}
                isContextMenuOpen={contextMenuTaskId === task.id}
                isExpanded={expandedTaskId === task.id}
                onExpand={() => handleTaskExpand(task.id)}
                onSelect={(e) => handleTaskSelect(task.id, e)}
              />
            </ContextMenuTrigger>
            <TaskContextMenu handleContextMenuAction={handleContextMenuAction} />
          </ContextMenu>
        ))}
      </div>
    )
  }

  // Client-side with drag and drop
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
        <div className="w-full">
          {tasks.map((task) => (
            <ContextMenu
              key={task.id}
              onOpenChange={(open) => {
                if (!open) handleContextMenuClose()
              }}
            >
              <ContextMenuTrigger onContextMenu={(e) => handleContextMenuOpen(task.id, e)}>
                <SortableTaskItem
                  id={task.id}
                  content={task.content}
                  checked={task.checked}
                  dueDate={task.dueDate}
                  flagged={task.flagged}
                  tags={task.tags}
                  onToggle={() => handleToggleTask(task.id)}
                  onEdit={(newContent) => handleEditTask(task.id, newContent)}
                  isEditing={editingId === task.id}
                  setEditing={() => setEditingId(task.id)}
                  isSelected={selectedTaskIds.has(task.id)}
                  isContextMenuOpen={contextMenuTaskId === task.id}
                  isExpanded={expandedTaskId === task.id}
                  onExpand={() => handleTaskExpand(task.id)}
                  onSelect={(e) => handleTaskSelect(task.id, e)}
                />
              </ContextMenuTrigger>
              <TaskContextMenu handleContextMenuAction={handleContextMenuAction} />
            </ContextMenu>
          ))}

          {/* Bottom drop area that integrates with DnD Kit */}
          <BottomDropArea />
        </div>
      </SortableContext>

      {typeof document !== "undefined" &&
        activeId &&
        createPortal(
          <DragOverlay adjustScale={false} zIndex={1000} dropAnimation={null}>
            {/* Match the exact structure of the original task item */}
            <div className="drag-overlay-wrapper">
              <div className="drag-overlay-container">
                <TaskItem
                  id={activeId}
                  content={tasks.find((task) => task.id === activeId)?.content || ""}
                  checked={tasks.find((task) => task.id === activeId)?.checked || false}
                  dueDate={tasks.find((task) => task.id === activeId)?.dueDate}
                  flagged={tasks.find((task) => task.id === activeId)?.flagged || false}
                  tags={tasks.find((task) => task.id === activeId)?.tags || []}
                  onToggle={() => {}}
                  onEdit={() => {}}
                  isDragging
                  isSelected={false} // Don't show as selected during drag
                  onSelect={() => {}}
                  className="dragged-task-item"
                />
                {isMultiDragging && selectedTaskIds.size > 1 && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    {selectedTaskIds.size}
                  </div>
                )}
              </div>
            </div>
          </DragOverlay>,
          document.body,
        )}
    </DndContext>
  )
}

// Reusable context menu component
function TaskContextMenu({ handleContextMenuAction }: { handleContextMenuAction: (action: string) => void }) {
  return (
    <ContextMenuContent>
      <ContextMenuItem onClick={() => handleContextMenuAction("setDueDate")}>
        <Calendar className="mr-2 h-4 w-4" />
        <span>Set Due Date</span>
        <ContextMenuShortcut>⌘D</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleContextMenuAction("setTags")}>
        <Tag className="mr-2 h-4 w-4" />
        <span>Set Tags</span>
        <ContextMenuShortcut>⌘T</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleContextMenuAction("defer")}>
        <Clock className="mr-2 h-4 w-4" />
        <span>Defer</span>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleContextMenuAction("complete")}>
        <Check className="mr-2 h-4 w-4" />
        <span>Mark Complete</span>
        <ContextMenuShortcut>⌘⏎</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => handleContextMenuAction("convertToProject")}>
        <ArrowRightLeft className="mr-2 h-4 w-4" />
        <span>Convert to Project</span>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleContextMenuAction("shareTask")}>
        <Share2 className="mr-2 h-4 w-4" />
        <span>Share Task</span>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => handleContextMenuAction("duplicate")}>
        <Copy className="mr-2 h-4 w-4" />
        <span>Duplicate</span>
        <ContextMenuShortcut>⌘C</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleContextMenuAction("delete")} className="text-red-500">
        <Trash className="mr-2 h-4 w-4" />
        <span>Delete</span>
        <ContextMenuShortcut>⌫</ContextMenuShortcut>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
