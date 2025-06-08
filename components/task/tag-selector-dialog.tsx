"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TagSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (tags: string[]) => void
  initialTags: string[]
  availableTags?: string[]
  title?: string
}

export function TagSelectorDialog({
  open,
  onOpenChange,
  onSave,
  initialTags = [],
  availableTags = ["Work", "Personal", "Urgent", "Important", "Project", "Meeting", "Follow-up", "Research"],
  title = "Manage Tags",
}: TagSelectorDialogProps) {
  const [selectedTags, setSelectedTags] = React.useState<string[]>(initialTags)
  const [newTagInput, setNewTagInput] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setSelectedTags(initialTags)
  }, [initialTags, open])

  const handleAddTag = () => {
    if (newTagInput.trim() && !selectedTags.includes(newTagInput.trim())) {
      setSelectedTags([...selectedTags, newTagInput.trim()])
      setNewTagInput("")
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  const handleAddExistingTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = () => {
    onSave(selectedTags)
    onOpenChange(false)
  }

  // Filter available tags to show only those not already selected
  const filteredAvailableTags = availableTags.filter((tag) => !selectedTags.includes(tag))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Add or remove tags for this task.</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Current tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Tags</label>
            <div className="flex flex-wrap gap-2 min-h-10 p-2 border rounded-md">
              {selectedTags.length > 0 ? (
                selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-2 py-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No tags selected</span>
              )}
            </div>
          </div>

          {/* Add new tag */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add New Tag</label>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a new tag"
                className="flex-1"
              />
              <Button onClick={handleAddTag} type="button" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Available tags */}
          {filteredAvailableTags.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Available Tags</label>
              <div className="flex flex-wrap gap-2">
                {filteredAvailableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="px-2 py-1 cursor-pointer hover:bg-secondary"
                    onClick={() => handleAddExistingTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
