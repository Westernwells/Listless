"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTaskContext } from "./task-context"
import { TaskItem } from "./task-item"
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

export function TrashView() {
  const { getTasksForList, restoreTask, permanentlyDeleteTask, emptyTrash } = useTaskContext()
  const [isEmptyTrashDialogOpen, setIsEmptyTrashDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)

  // Get trashed tasks
  const trashedTasks = getTasksForList("trash")

  const confirmEmptyTrash = () => {
    emptyTrash()
    setIsEmptyTrashDialogOpen(false)
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
              <div key={task.id} className="flex items-center group">
                <TaskItem
                  id={task.id}
                  content={task.content}
                  checked={task.checked}
                  dueDate={task.dueDate}
                  flagged={task.flagged}
                  tags={task.tags}
                  onToggle={() => {}}
                  onEdit={() => {}}
                  className="flex-1 opacity-70"
                />
              </div>
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
