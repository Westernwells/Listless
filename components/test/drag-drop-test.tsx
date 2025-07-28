"use client"

import { useEffect, useState } from "react"
import { useDragContext } from "../task/drag-context"

/**
 * Test component to validate drag-and-drop functionality
 * This component logs drag events and provides visual feedback for testing
 */
export function DragDropTest() {
  const { isDraggingTask, activeDroppableId, isDraggingOver, sortableItems, activeTaskId } = useDragContext()
  const [dragEvents, setDragEvents] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(true)
  const [mountTime, setMountTime] = useState<string>("")

  // Log when component mounts - set mount time on client only to prevent hydration mismatch
  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString()
    setMountTime(currentTime)
    console.log("🧪 DragDropTest component mounted at", currentTime)
    console.log("🧪 Initial drag context state:", {
      isDraggingTask,
      activeTaskId,
      sortableItems: sortableItems.length
    })

    // Test if drag context is working by checking if sortable items are populated
    if (sortableItems.length > 0) {
      console.log("✅ Drag context appears to be working - sortable items found:", sortableItems)
    } else {
      console.log("⚠️ No sortable items found - drag context may not be initialized yet")
    }
  }, [])

  // Monitor sortable items changes
  useEffect(() => {
    if (sortableItems.length > 0) {
      console.log("🎯 Sortable items updated:", sortableItems.length, "items")
    }
  }, [sortableItems])

  useEffect(() => {
    if (isDraggingTask) {
      setDragEvents(prev => [...prev, `🎯 Drag started at ${new Date().toLocaleTimeString()}`])
      console.log("🎯 DRAG STARTED - UI freeze test should show if this appears")
    } else if (dragEvents.length > 0) {
      setDragEvents(prev => [...prev, `🏁 Drag ended at ${new Date().toLocaleTimeString()}`])
      console.log("🏁 DRAG ENDED")
    }
  }, [isDraggingTask])

  useEffect(() => {
    if (activeDroppableId) {
      setDragEvents(prev => [...prev, `📍 Hovering over: ${activeDroppableId}`])
    }
  }, [activeDroppableId])

  // Clear events after 10 seconds
  useEffect(() => {
    if (dragEvents.length > 0) {
      const timer = setTimeout(() => {
        setDragEvents([])
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [dragEvents])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-50 text-xs"
      >
        Show Debug
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50"
      onClick={() => {
        console.log("🧪 DEBUG PANEL CLICKED - Testing console output", {
          isDraggingTask,
          activeTaskId,
          sortableItems: sortableItems.length,
          timestamp: new Date().toLocaleTimeString()
        })
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">🧪 Drag & Drop Debug (Click to Test)</h3>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsVisible(false)
          }}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1">
        <div className="text-xs">
          <span className="font-medium">Status:</span> {isDraggingTask ? "🎯 Dragging" : "🏁 Idle"}
        </div>
        <div className="text-xs">
          <span className="font-medium">Active Task:</span> {activeTaskId || "None"}
        </div>
        <div className="text-xs">
          <span className="font-medium">Sortable Items:</span> {sortableItems.length} items
        </div>
        <div className="text-xs">
          <span className="font-medium">Mounted:</span> {mountTime || "Loading..."}
        </div>
        {activeDroppableId && (
          <div className="text-xs">
            <span className="font-medium">Target:</span> {activeDroppableId}
          </div>
        )}
        <div className="text-xs">
          <span className="font-medium">Sidebar Tests:</span>
          <ul className="ml-2 mt-1">
            <li>📥 Inbox: {isDraggingOver("inbox") ? "✅" : "⭕"}</li>
            <li>📅 Today: {isDraggingOver("today") ? "✅" : "⭕"}</li>
            <li>⏰ Scheduled: {isDraggingOver("scheduled") ? "✅" : "⭕"}</li>
            <li>⏸️ Deferred: {isDraggingOver("deferred") ? "✅" : "⭕"}</li>
          </ul>
        </div>
      </div>
      {dragEvents.length > 0 && (
        <div className="mt-3 border-t pt-2">
          <div className="text-xs font-medium mb-1">Recent Events:</div>
          <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
            {dragEvents.slice(-5).map((event, index) => (
              <div key={index} className="text-gray-600">{event}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
