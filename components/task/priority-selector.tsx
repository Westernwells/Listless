"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Flag } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PrioritySelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPriority: string | null | undefined
  onPriorityChange: (priority: string | null) => void
  triggerElement?: HTMLElement | null
}

// Priority options with their colors
const priorities = [
  { value: "high", label: "High", color: "#e53935" }, // Red
  { value: "medium", label: "Medium", color: "#fb8c00" }, // Orange
  { value: "low", label: "Low", color: "#fdd835" }, // Yellow
  { value: "blue", label: "Blue", color: "#1e88e5" }, // Blue
  { value: null, label: "No Priority", color: "#9e9e9e" }, // Gray
]

export function PrioritySelector({ open, onOpenChange, selectedPriority, onPriorityChange, triggerElement }: PrioritySelectorProps) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Update position when the popover opens
  React.useEffect(() => {
    if (open && triggerElement) {
      const rect = triggerElement.getBoundingClientRect()
      setPosition({
        x: rect.left,
        y: rect.bottom + window.scrollY
      })
    }
  }, [open, triggerElement])

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

  if (!open) return null

  // Use portal to render outside any scrollable containers
  return typeof document !== "undefined" ? createPortal(
    <div
      ref={containerRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-border"
      style={{
        left: position.x,
        top: position.y,
        width: "192px" // w-48 equivalent
      }}
    >
      <div className="p-1">
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
      </div>
    </div>,
    document.body
  ) : null
}
