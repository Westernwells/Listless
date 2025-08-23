"use client"

import React from "react"
import { Plus } from "lucide-react"

interface InlineAddTaskButtonProps {
  onClick: () => void
  className?: string
  position?: "top" | "bottom"
}

export function InlineAddTaskButton({ 
  onClick, 
  className = "",
  position = "bottom"
}: InlineAddTaskButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 
        text-black hover:text-purple-600 
        transition-colors duration-200 
        py-3 px-4 
        text-sm font-medium
        cursor-pointer
        group
        ${position === "top" ? "mb-2" : "mt-2"}
        ${className}
      `}
      aria-label="Add new task"
    >
      <Plus className="h-4 w-4 transition-colors duration-200 group-hover:text-purple-600" />
      <span className="transition-colors duration-200 group-hover:text-purple-600">
        Add task
      </span>
    </button>
  )
}
