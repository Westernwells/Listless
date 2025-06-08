"use client"

import { useState, useRef, useEffect } from "react"
import { MoreHorizontal, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TaskList } from "./task/task-list"
import { useTaskContext } from "./task/task-context"

interface ProjectViewProps {
  projectId: string
}

export function ProjectView({ projectId }: ProjectViewProps) {
  const { getTasksForList, getProject, updateProject } = useTaskContext()
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState("")
  const titleInputRef = useRef<HTMLInputElement>(null)

  const project = getProject(projectId)
  const tasks = getTasksForList(projectId)

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

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 pt-6 pb-0">
        {/* Project Header - Simplified to match screenshot */}
        <div className="flex items-center mb-4">
          <Circle className="h-6 w-6 mr-3 text-blue-500 fill-blue-500 stroke-none" />
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
              className="text-xl font-bold flex-grow bg-transparent border-none outline-none focus:ring-0"
            />
          ) : (
            <h1 className="text-xl font-bold flex-grow cursor-text" onClick={() => setIsEditingTitle(true)}>
              {project.name}
            </h1>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-5 w-5 text-gray-500" />
            <span className="sr-only">More options</span>
          </Button>
        </div>

        {/* Notes Section - Simplified to match screenshot */}
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
      <div className="flex-1 overflow-auto">
        <TaskList initialTasks={tasks} title="" showHeader={false} />
      </div>
    </div>
  )
}
