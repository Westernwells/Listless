"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskContext } from "./task-context"
import { ArrowRightLeft } from "lucide-react"

interface TaskConversionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
}

export function TaskConversionDialog({ open, onOpenChange, taskId }: TaskConversionDialogProps) {
  const { convertTaskToProject, areas, allTasks } = useTaskContext()
  const [projectName, setProjectName] = useState("")
  const [selectedArea, setSelectedArea] = useState<string | null>(null)

  // Find the task to convert
  const task = allTasks.find((t) => t.id === taskId)

  // Initialize project name from task content
  useEffect(() => {
    if (task && open) {
      setProjectName(task.content)
    }
  }, [task, open])

  const handleConvert = () => {
    if (projectName.trim()) {
      convertTaskToProject(taskId, projectName, selectedArea)
      onOpenChange(false)
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ArrowRightLeft className="mr-2 h-5 w-5" />
            Convert Task to Project
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Area (Optional)</Label>
            <Select value={selectedArea || ""} onValueChange={setSelectedArea}>
              <SelectTrigger id="area">
                <SelectValue placeholder="Select an area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-area">No Area</SelectItem>
                {Object.values(areas).map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Converting this task will:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>Create a new project with the task's content as the name</li>
              <li>Move any task notes to the project description</li>
              <li>Remove the original task</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConvert}>Convert to Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
