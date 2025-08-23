"use client"

import { useState, useRef, useEffect } from "react"
import { MoreHorizontal, Circle, ListTodo, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TaskList } from "./task/task-list"
import { useTaskContext } from "./task/task-context"
import { useProjectTaskCount } from "@/hooks/use-task-counts"

interface ProjectViewProps {
  projectId: string
}

export function ProjectView({ projectId }: ProjectViewProps) {
  const { getTasksForList, getProject, updateProject, createTask } = useTaskContext()
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState("")
  const titleInputRef = useRef<HTMLInputElement>(null)

  const project = getProject(projectId)
  const tasks = getTasksForList(projectId)

  // Get dynamic task count for the header
  const { data: projectTaskCount = 0 } = useProjectTaskCount(projectId)

  // Initialize title and notes from project
  useEffect(() => {
    if (project) {
      setTitle(project.name || "")
      setNotes(project.description || "")
    }
  }, [project])

  // Focus input when editing title and position cursor without selecting text
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      // Position cursor at the end without selecting text
      const length = titleInputRef.current.value.length
      titleInputRef.current.setSelectionRange(length, length)
    }
  }, [isEditingTitle])

  // Initialize notes from project
  useEffect(() => {
    if (project) {
      setNotes(project.description || "")
    }
  }, [project])

  // Focus textarea when editing
  useEffect(() => {
    if (isEditingNotes && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditingNotes])

  const handleSaveNotes = () => {
    if (project) {
      updateProject(projectId, { description: notes })
      setIsEditingNotes(false)
    }
  }

  const handleSaveTitle = () => {
    if (project) {
      updateProject(projectId, { name: title })
      setIsEditingTitle(false)
    }
  }

  const handleAddTask = () => {
    if (project) {
      createTask({
        title: "",
        description: "",
        project_list_id: projectId,
      })
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header matching Today view styling */}
      <div className="px-12 pt-12 pb-6">
        <div className="grid grid-cols-3 items-center">
          {/* Left: Title and count */}
          <div className="justify-self-start">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-muted-foreground" />
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle()
                    if (e.key === "Escape") {
                      setTitle(project.name)
                      setIsEditingTitle(false)
                    }
                  }}
                  className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-0"
                />
              ) : (
                <span className="cursor-text" onClick={() => setIsEditingTitle(true)}>
                  {project.name}
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {projectTaskCount} tasks remaining
            </p>
          </div>

          {/* Center: Empty space */}
          <div></div>

          {/* Right: Add Task button */}
          <div className="justify-self-end">
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-black text-white hover:bg-black/90 h-7 px-2.5 text-xs gap-0"
                      onClick={handleAddTask}
                      aria-label="Add new task"
                    >
                      <Plus className="h-4 w-4 mr-1 text-white" />
                      Add Task
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Add a new task (Space)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section - Simplified */}
      <div className="px-12 pb-6">
        <div className="mb-6">
          {isEditingNotes ? (
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Add notes about this project..."
                className="min-h-[100px] text-sm border-none p-0 focus-visible:ring-0 resize-none"
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsEditingNotes(false)} className="h-7 px-2 text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNotes} className="h-7 px-2 text-xs">
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="text-sm text-muted-foreground min-h-[24px] whitespace-pre-wrap cursor-text"
              onClick={() => setIsEditingNotes(true)}
            >
              {notes || "Click to add notes"}
            </div>
          )}
        </div>
      </div>

      {/* Project Tasks - Modified to hide the header */}
      <div className="flex-1 overflow-auto w-full task-list-container pl-8 pt-4">
        <TaskList initialTasks={[]} title="" showHeader={false} view="project" projectId={projectId} />
      </div>
    </div>
  )
}
