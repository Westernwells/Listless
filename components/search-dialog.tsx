"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Calendar, Tag, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTaskContext } from "./task/task-context"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { allTasks, setActiveListId, findTaskList } = useTaskContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<typeof allTasks>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input when the dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setSearchQuery("")
      setSearchResults([])
    }
  }, [open])

  // Search tasks when the query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const results = allTasks.filter((task) => {
      // Search in task content
      if (task.content.toLowerCase().includes(query)) return true

      // Search in task notes
      if (task.notes && task.notes.toLowerCase().includes(query)) return true

      // Search in task tags
      if (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(query))) return true

      return false
    })

    setSearchResults(results)
  }, [searchQuery, allTasks])

  const handleTaskClick = (taskId: string) => {
    const listId = findTaskList(taskId)
    if (listId) {
      setActiveListId(listId)
      onOpenChange(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return format(parseISO(dateString), "MMM d, yyyy")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        {/* Custom overlay with reduced opacity and blur */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[600px] translate-x-[-50%] translate-y-[-50%] gap-0 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg overflow-hidden"
          )}
        >
        <div className="flex items-center border-b p-4">
          <Search className="h-5 w-5 mr-2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, tags, and notes..."
            className="border-0 focus-visible:ring-0 flex-1"
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="flex items-center">
                    <div
                      className={`h-4 w-4 rounded-full mr-2 ${task.checked ? "bg-green-500" : "border border-gray-300"}`}
                    >
                      {task.checked && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <span className={`font-medium ${task.checked ? "line-through text-muted-foreground" : ""}`}>
                      {task.content}
                    </span>
                  </div>

                  <div className="flex items-center mt-1 ml-6 text-xs text-muted-foreground">
                    {task.dueDate && (
                      <div className="flex items-center mr-3">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(task.dueDate)}
                      </div>
                    )}

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        <div className="flex gap-1">
                          {task.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-[10px] px-1 py-0 h-4">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {task.notes && <div className="ml-6 mt-1 text-xs text-muted-foreground truncate">{task.notes}</div>}
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mb-2 opacity-20" />
              <p>No results found</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mb-2 opacity-20" />
              <p>Type to search</p>
            </div>
          )}
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
