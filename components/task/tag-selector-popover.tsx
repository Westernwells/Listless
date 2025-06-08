"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TagSelectorPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

// Sample available tags - in a real app, these would come from a database or context
const availableTags = [
  "Momentum Pusher Action",
  "TIME BASED",
  "Urgent",
  "Next",
  "STATE",
  "Tired",
  "TechSetup",
  "Food",
  "Freelancer",
  "Timely",
]

export function TagSelectorPopover({ open, onOpenChange, selectedTags, onTagsChange }: TagSelectorPopoverProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [localSelectedTags, setLocalSelectedTags] = React.useState<string[]>(selectedTags)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // Reset local state when the popover opens
  React.useEffect(() => {
    if (open) {
      setLocalSelectedTags(selectedTags)
      setSearchQuery("")
    }
  }, [open, selectedTags])

  // Filter tags based on search query
  const filteredTags = availableTags.filter((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setLocalSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // Apply changes
  const handleApply = () => {
    onTagsChange(localSelectedTags)
    onOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button ref={triggerRef} className="hidden">
          Hidden Trigger
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-2 border-b">
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-60 overflow-y-auto py-1">
          {filteredTags.map((tag) => (
            <div
              key={tag}
              className={cn(
                "flex items-center px-3 py-1.5 cursor-pointer hover:bg-gray-100",
                localSelectedTags.includes(tag) && "bg-gray-50",
              )}
              onClick={() => toggleTag(tag)}
            >
              <div className="w-5 h-5 mr-2 flex items-center justify-center">
                {localSelectedTags.includes(tag) && <Check className="h-4 w-4" />}
              </div>
              <span className="text-sm">{tag}</span>
            </div>
          ))}
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
      </PopoverContent>
    </Popover>
  )
}
