"use client"

import * as React from "react"
import { Flag } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PrioritySelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPriority: string | null | undefined
  onPriorityChange: (priority: string | null) => void
}

// Priority options with their colors
const priorities = [
  { value: "high", label: "High", color: "#e53935" }, // Red
  { value: "medium", label: "Medium", color: "#fb8c00" }, // Orange
  { value: "low", label: "Low", color: "#fdd835" }, // Yellow
  { value: "blue", label: "Blue", color: "#1e88e5" }, // Blue
  { value: null, label: "No Priority", color: "#9e9e9e" }, // Gray
]

export function PrioritySelector({ open, onOpenChange, selectedPriority, onPriorityChange }: PrioritySelectorProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button ref={triggerRef} className="hidden">
          Hidden Trigger
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        {priorities.map((priority) => (
          <div
            key={priority.value || "none"}
            className={cn(
              "flex items-center px-3 py-1.5 cursor-pointer rounded-md hover:bg-gray-100",
              selectedPriority === priority.value && "bg-gray-50",
            )}
            onClick={() => {
              onPriorityChange(priority.value)
              onOpenChange(false)
            }}
          >
            <Flag
              className="h-4 w-4 mr-2"
              style={{ color: priority.color }}
              fill={selectedPriority === priority.value ? priority.color : "transparent"}
            />
            <span className="text-sm">{priority.label}</span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
