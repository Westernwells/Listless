"use client"

import * as React from "react"
import { useState } from "react"
import { Search, Plus, X, Trash2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTags, useCreateTag, useDeleteTag, useTagUsageCount, useTagsWithUsageCounts } from "@/hooks/use-tags"
import { FrontendTag } from "@/lib/api/tag-service"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Color options for tags
const TAG_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#f97316', // orange
  '#84cc16', // lime
  '#06b6d4', // cyan
]

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag: FrontendTag | null
  usageCount: number
  onConfirm: () => void
}

function DeleteConfirmationDialog({ open, onOpenChange, tag, usageCount, onConfirm }: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Delete Tag</DialogTitle>
          <DialogDescription className="text-sm">
            Do you really want to delete the tag "{tag?.name}"?
            {usageCount > 0 && (
              <span className="block mt-2 text-orange-600 font-medium">
                There are currently {usageCount} task{usageCount !== 1 ? 's' : ''} which have this tag.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CreateTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CreateTagDialog({ open, onOpenChange }: CreateTagDialogProps) {
  const [tagName, setTagName] = useState("")
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0])
  const createTagMutation = useCreateTag()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tagName.trim()) return

    try {
      await createTagMutation.mutateAsync({
        name: tagName.trim(),
        color: selectedColor
      })

      toast({
        title: "Success",
        description: "Tag created successfully",
      })

      setTagName("")
      setSelectedColor(TAG_COLORS[0])
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Create New Tag</DialogTitle>
          <DialogDescription className="text-sm">
            Add a new tag to organize your tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name" className="text-sm font-medium">Tag Name</Label>
            <Input
              id="tag-name"
              placeholder="Enter tag name..."
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Color</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all hover:scale-105",
                    selectedColor === color ? "border-gray-900 scale-110" : "border-gray-300"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!tagName.trim() || createTagMutation.isPending}>
              {createTagMutation.isPending ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TagsView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteTag, setDeleteTag] = useState<FrontendTag | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: tags = [], isLoading: tagsLoading } = useTags()
  const deleteTagMutation = useDeleteTag()

  // Get usage counts for all tags
  const { data: usageCounts = {} } = useTagsWithUsageCounts(tags)

  // Get usage count for the tag being deleted
  const { data: usageData } = useTagUsageCount(deleteTag?.id || "")
  const usageCount = usageData?.usage_count || 0

  // Filter tags based on search query
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteClick = (tag: FrontendTag) => {
    setDeleteTag(tag)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTag) return

    try {
      await deleteTagMutation.mutateAsync(deleteTag.id)

      toast({
        title: "Success",
        description: "Tag deleted successfully",
      })

      setShowDeleteDialog(false)
      setDeleteTag(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tag. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (tagsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header matching TaskList and CompletedView styling */}
      <div className="px-12 pt-12 pb-6">
        <div className="grid grid-cols-3 items-center">
          {/* Left: Title and count */}
          <div className="justify-self-start">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Tag className="h-5 w-5 text-muted-foreground" />
              Tags
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {tags.length} tag{tags.length !== 1 ? 's' : ''} total
            </p>
          </div>

          {/* Center: Search Bar */}
          <div className="justify-self-center w-full max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8 text-sm"
              />
            </div>
          </div>

          {/* Right: New Tag Button */}
          <div className="justify-self-end">
            <Button
              variant="default"
              size="sm"
              className="bg-black text-white hover:bg-black/90 h-7 px-2.5 text-xs gap-0"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1 text-white" />
              New Tag
            </Button>
          </div>
        </div>
      </div>

      {/* Tags List */}
      <div className="flex-1 overflow-auto w-full task-list-container pl-8 pt-4">
        {filteredTags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No tags found matching your search." : "No tags yet. Create your first tag!"}
          </div>
        ) : (
          <div className="space-y-2 pr-8">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: tag.color || '#6366f1' }}
                  />
                  <span className="text-sm font-medium">{tag.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs h-5 px-2">
                    {usageCounts[tag.id] || 0} task{(usageCounts[tag.id] || 0) !== 1 ? 's' : ''}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(tag)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateTagDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        tag={deleteTag}
        usageCount={usageCount}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
