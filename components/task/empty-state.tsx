"use client"

import React from "react"

interface EmptyStateProps {
  message?: string
  className?: string
}

export function EmptyState({ 
  message = "Press 'Space Bar' to create a new task", 
  className = "" 
}: EmptyStateProps) {
  return (
    <div className={`flex items-center justify-center h-full min-h-[200px] ${className}`}>
      <p className="text-gray-400 text-sm text-center">
        {message}
      </p>
    </div>
  )
}
