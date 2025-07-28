"use client"

import { useState } from "react"
import { Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskItem } from "./task-item"
import { useDeletedTasks, useRestoreTask, usePermanentDeleteTask } from "@/hooks/use-tasks"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export function TrashView() {
  const [isEmptyTrashDialogOpen, setIsEmptyTrashDialogOpen] = useState(false)
  const [contextMenuTaskId, setContextMenuTaskId] = useState<string | null>(null)

  // Use TanStack Query hooks for real backend data
  const { data: trashedTasks = [], isLoading, error } = useDeletedTasks()
  const restoreTaskMutation = useRestoreTask()
  const permanentDeleteMutation = usePermanentDeleteTask()

  const handleContextMenuOpen = (taskId: string, event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenuTaskId(taskId)
  }

  const handleContextMenuClose = () => {
    setContextMenuTaskId(null)
  }

  const handleRestoreTask = (taskId: string) => {
    restoreTaskMutation.mutate([taskId])
    setContextMenuTaskId(null)
  }

  const handlePermanentDelete = (taskId: string) => {
    permanentDeleteMutation.mutate({ taskIds: [taskId] })
    setContextMenuTaskId(null)
  }

  const confirmEmptyTrash = () => {
    permanentDeleteMutation.mutate({ deleteAll: true })
    setIsEmptyTrashDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold flex items-center">
            <Trash2 className="mr-2 h-5 w-5 text-red-500" />
            Trash
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold flex items-center">
            <Trash2 className="mr-2 h-5 w-5 text-red-500" />
            Trash
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">Error loading trash: {error.message}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold flex items-center">
          <Trash2 className="mr-2 h-5 w-5 text-red-500" />
          Trash
        </h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsEmptyTrashDialogOpen(true)}
          disabled={trashedTasks.length === 0}
        >
          Empty Trash
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {trashedTasks.length > 0 ? (
          <div className="space-y-1">
            {trashedTasks.map((task) => (
              <ContextMenu
                key={task.id}
                onOpenChange={(open) => {
                  if (!open) handleContextMenuClose()
                }}
              >
                <ContextMenuTrigger onContextMenu={(e) => handleContextMenuOpen(task.id, e)}>
                  <div className="flex items-center group">
                    <TaskItem
                      id={task.id}
                      content={task.content}
                      checked={task.checked}
                      dueDate={task.dueDate}
                      flagged={task.flagged}
                      tags={task.tags}
                      onToggle={() => {}} // Disabled in trash
                      onEdit={() => {}} // Disabled in trash
                      className="flex-1 opacity-70"
                      isContextMenuOpen={contextMenuTaskId === task.id}
                    />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleRestoreTask(task.id)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    <span>Restore</span>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => handlePermanentDelete(task.id)}
                    className="text-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Permanently</span>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Trash2 className="h-12 w-12 mb-2 opacity-20" />
            <p>Trash is empty</p>
          </div>
        )}
      </div>

      {/* Confirm empty trash dialog */}
      <AlertDialog open={isEmptyTrashDialogOpen} onOpenChange={setIsEmptyTrashDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty Trash</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all tasks in the trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEmptyTrash} className="bg-red-500 hover:bg-red-600">
              Empty Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
