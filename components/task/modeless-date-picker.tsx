"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ModelessDatePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (date: Date) => void
  title: string
  position: { x: number; y: number }
  initialDate?: Date
}

export function ModelessDatePicker({ open, onClose, onSelect, title, position, initialDate }: ModelessDatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(initialDate)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Handle click outside to close the picker
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onClose])

  // Handle escape key to close the picker
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown, { passive: false })
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose])

  // Calculate position to ensure the picker stays within viewport
  const calculatePosition = () => {
    if (typeof window === "undefined") return {}

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Fixed dimensions for the picker
    const pickerWidth = 336 // Fixed width that won't change with screen size
    const pickerHeight = 400

    // Initial position
    let left = position.x
    let top = position.y

    // Adjust if too close to right edge
    if (left + pickerWidth > viewportWidth) {
      left = viewportWidth - pickerWidth - 10
    }

    // Adjust if too close to bottom edge
    if (top + pickerHeight > viewportHeight) {
      top = viewportHeight - pickerHeight - 10
    }

    // Ensure not positioned off-screen
    left = Math.max(10, left)
    top = Math.max(10, top)

    return { left, top }
  }

  if (!open) return null

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      onSelect(selectedDate)
    }
  }

  const pos = calculatePosition()

  // Use portal to render outside any scrollable containers
  return typeof document !== "undefined" ? createPortal(
    <div
      ref={containerRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-border date-picker-container"
      style={{
        left: pos.left,
        top: pos.top,
        width: "336px", // Fixed width
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">{title}</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          className="fixed-calendar"
          showOutsideDays
          fixedWeeks
        />
      </div>
    </div>,
    document.body
  ) : null
}
