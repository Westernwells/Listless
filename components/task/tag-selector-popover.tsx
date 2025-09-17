"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTags, useCreateTag, useAddTagToTask, useRemoveTagFromTask, useDeleteTag } from "@/hooks/use-tags"
import { FrontendTag } from "@/lib/api/tag-service"

interface TagSelectorPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  triggerElement?: HTMLElement | null
  taskId?: string // Add taskId for direct tag operations
}

// This component now fetches tags from the database

export function TagSelectorPopover({ open, onOpenChange, selectedTags, onTagsChange, triggerElement, taskId }: TagSelectorPopoverProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [localSelectedTags, setLocalSelectedTags] = React.useState<string[]>(selectedTags)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isDeleteMode, setIsDeleteMode] = React.useState(false)
  const [selectedTagsForDeletion, setSelectedTagsForDeletion] = React.useState<string[]>([])

  const containerRef = React.useRef<HTMLDivElement>(null)

  // Database hooks
  const { data: availableTags = [], isLoading: tagsLoading } = useTags()
  const createTagMutation = useCreateTag()
  const addTagToTaskMutation = useAddTagToTask()
  const removeTagFromTaskMutation = useRemoveTagFromTask()
  const deleteTagMutation = useDeleteTag()

  // Reset local state when the popover opens
  React.useEffect(() => {
    if (open) {
      setLocalSelectedTags(selectedTags)
      setSearchQuery("")

      // Update position when the popover opens
      if (triggerElement) {
        const rect = triggerElement.getBoundingClientRect()
        setPosition({
          x: rect.left,
          y: rect.bottom + window.scrollY
        })
      }
    }
  }, [open, selectedTags, triggerElement])

  // Handle click outside to close the selector
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onOpenChange])

  // Handle click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
          triggerElement && !triggerElement.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onOpenChange, triggerElement])

  // Delete selected tags - moved before useEffect that references it
  const handleDeleteSelectedTags = React.useCallback(async () => {
    if (selectedTagsForDeletion.length === 0) return

    try {
      for (const tagName of selectedTagsForDeletion) {
        const tag = availableTags.find(t => t.name === tagName)
        if (tag) {
          await deleteTagMutation.mutateAsync(tag.id)
        }
      }
      setSelectedTagsForDeletion([])
      setIsDeleteMode(false)
    } catch (error) {
      console.error('Failed to delete tags:', error)
    }
  }, [selectedTagsForDeletion, availableTags, deleteTagMutation])

  // Handle keyboard events for tag deletion
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedTagsForDeletion.length > 0) {
          handleDeleteSelectedTags()
        }
      } else if (event.key === 'Escape') {
        setIsDeleteMode(false)
        setSelectedTagsForDeletion([])
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [open, selectedTagsForDeletion, handleDeleteSelectedTags])

  // Filter tags based on search query
  const filteredTags = availableTags.filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Toggle tag selection (only update local state, don't save to database yet)
  const toggleTag = (tagName: string) => {
    setLocalSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    )
  }

  // Create new tag from search query
  const handleCreateTag = async () => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return

    // Check if tag already exists (case-insensitive)
    const existingTag = availableTags.find(tag => tag.name.toLowerCase() === trimmedQuery.toLowerCase())
    if (existingTag) {
      // If tag exists, just toggle it instead of creating
      await toggleTag(existingTag.name)
      setSearchQuery("")
      return
    }

    try {
      const newTag = await createTagMutation.mutateAsync({ name: trimmedQuery })
      if (newTag) {
        // Add the new tag to local selection (will be saved when Apply is clicked)
        setLocalSelectedTags(prev => [...prev, newTag.name])
      }
      setSearchQuery("")
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }



  // Apply changes - save to database if taskId is provided
  const handleApply = async () => {
    let hasError = false

    if (taskId) {
      // Determine which tags to add and remove
      const currentTagNames = selectedTags
      const newTagNames = localSelectedTags

      const tagsToAdd = newTagNames.filter(name => !currentTagNames.includes(name))
      const tagsToRemove = currentTagNames.filter(name => !newTagNames.includes(name))

      try {
        // Remove tags that are no longer selected
        for (const tagName of tagsToRemove) {
          const tag = availableTags.find(t => t.name === tagName)
          if (tag) {
            await removeTagFromTaskMutation.mutateAsync({ taskId, tagId: tag.id })
          }
        }

        // Add newly selected tags
        for (const tagName of tagsToAdd) {
          const tag = availableTags.find(t => t.name === tagName)
          if (tag) {
            await addTagToTaskMutation.mutateAsync({ taskId, tagId: tag.id })
          }
        }
      } catch (error) {
        console.error('Failed to update tags:', error)
        hasError = true
        // Reset local state on error
        setLocalSelectedTags(selectedTags)
      }
    }

    // Always close the dialog and call onTagsChange, even if there was an error
    onTagsChange(localSelectedTags)
    onOpenChange(false)
  }

  if (!open) return null

  // Use portal to render outside any scrollable containers
  return typeof document !== "undefined" ? createPortal(
    <div
      ref={containerRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-border"
      style={{
        left: position.x,
        top: position.y,
        width: "256px" // w-64 equivalent
      }}
    >
        <div className="p-2 border-b space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tags</span>
          </div>
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreateTag()
              }
            }}
            className="h-8"
          />
        </div>
        <div className="max-h-60 overflow-y-auto py-1">
          {tagsLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading tags...</div>
          ) : (
            <>
              {/* Show create option if search doesn't match existing tags */}
              {searchQuery.trim() && !availableTags.some(tag => tag.name.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                <div
                  className="flex items-center px-3 py-1.5 cursor-pointer hover:bg-gray-100 border-b"
                  onClick={handleCreateTag}
                >
                  <div className="w-5 h-5 mr-2 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">+</span>
                  </div>
                  <span className="text-sm text-blue-600">Create "{searchQuery.trim()}"</span>
                </div>
              )}

              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className={cn(
                    "flex items-center px-3 py-1.5 cursor-pointer hover:bg-gray-100",
                    localSelectedTags.includes(tag.name) && "bg-blue-50 border-l-2 border-blue-500",
                  )}
                  onClick={() => toggleTag(tag.name)}
                >
                  <div className="w-5 h-5 mr-2 flex items-center justify-center">
                    {localSelectedTags.includes(tag.name) && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: tag.color || '#6366f1' }}
                    />
                    <span className="text-sm">
                      {tag.name}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
          {filteredTags.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No tags found</div>}
        </div>
        <div className="p-2 border-t flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </div>,
    document.body
  ) : null
}
