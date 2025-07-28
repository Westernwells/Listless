"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { ChevronRight, Layers, Layers2, MoreHorizontal, Plus, ListTodo } from "lucide-react"
import { useTaskContext } from "./task/task-context"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Add imports for droppable functionality
import { useDroppable } from "@dnd-kit/core"
import { useDragContext } from "./task/drag-context"
import { cn } from "@/lib/utils"
import { useProjectTaskCount } from "@/hooks/use-task-counts"

export function NavProjects() {
  const { isMobile } = useSidebar()
  const {
    setActiveListId,
    projects: contextProjects,
    areas: contextAreas,
    setProjects,
    setTasks,
    setAreas,
  } = useTaskContext()
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { isDraggingTask } = useDragContext()
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({})
  const [animatingAreas, setAnimatingAreas] = useState<Record<string, "idle" | "expanding" | "collapsing">>({})

  const [newProjectCounter, setNewProjectCounter] = useState(1)
  const [newAreaCounter, setNewAreaCounter] = useState(1)

  // Create dynamic projects structure from context state
  const projects = useMemo(
    () => ({
      title: "Projects",
      isHeader: true,
      areas: Object.values(contextAreas).map((area) => ({
        name: area.name,
        lists: Object.values(contextProjects)
          .filter((project) => project.areaId === area.id)
          .map((project) => ({
            name: project.name,
            url: `#${project.id}`,
          })),
      })),
      standaloneLists: Object.values(contextProjects)
        .filter((project) => project.areaId === null)
        .map((project) => ({
          name: project.name,
          url: `#${project.id}`,
        })),
    }),
    [contextProjects, contextAreas],
  )

  const createNewProject = () => {
    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const projectName = `New Project ${newProjectCounter}`

    const newProject = {
      id: projectId,
      name: projectName,
      description: "",
      areaId: null,
    }

    // Add the project to the projects state
    setProjects((prev) => ({
      ...prev,
      [projectId]: newProject,
    }))

    // Create an empty task list for the new project
    setTasks((prev) => ({
      ...prev,
      [projectId]: [],
    }))

    // Increment the counter for next project
    setNewProjectCounter((prev) => prev + 1)

    // Navigate to the new project with a slight delay to ensure state update
    setTimeout(() => {
      setActiveListId(projectId)
    }, 100)
  }

  const createNewArea = () => {
    const areaId = `area-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const areaName = `New Area ${newAreaCounter}`

    const newArea = {
      id: areaId,
      name: areaName,
      isCollapsed: false,
    }

    // Add the area to the areas state
    setAreas((prev) => ({
      ...prev,
      [areaId]: newArea,
    }))

    // Initialize the area as expanded
    setExpandedAreas((prev) => ({
      ...prev,
      [areaName]: true,
    }))

    setAnimatingAreas((prev) => ({
      ...prev,
      [areaName]: "idle",
    }))

    // Increment the counter for next area
    setNewAreaCounter((prev) => prev + 1)
  }

  const createNewListInArea = (areaId: string) => {
    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const projectName = `New List ${newProjectCounter}`

    const newProject = {
      id: projectId,
      name: projectName,
      description: "",
      areaId: areaId,
    }

    // Add the project to the projects state
    setProjects((prev) => ({
      ...prev,
      [projectId]: newProject,
    }))

    // Create an empty task list for the new project
    setTasks((prev) => ({
      ...prev,
      [projectId]: [],
    }))

    // Increment the counter for next project
    setNewProjectCounter((prev) => prev + 1)

    // Navigate to the new project with a slight delay to ensure state update
    setTimeout(() => {
      setActiveListId(projectId)
    }, 100)
  }

  // Initialize all areas as expanded
  useEffect(() => {
    const initialState: Record<string, boolean> = {}
    const initialAnimationState: Record<string, "idle" | "expanding" | "collapsing"> = {}

    Object.values(contextAreas).forEach((area) => {
      initialState[area.name] = true
      initialAnimationState[area.name] = "idle"
    })

    setExpandedAreas(initialState)
    setAnimatingAreas(initialAnimationState)
  }, [contextAreas])

  // Ensure areas are expanded when dragging
  useEffect(() => {
    if (isDraggingTask) {
      const updatedState: Record<string, boolean> = {}
      Object.values(contextAreas).forEach((area) => {
        updatedState[area.name] = true
      })
      setExpandedAreas(updatedState)
    }
  }, [isDraggingTask, contextAreas])

  useEffect(() => {
    if (editingItem && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingItem])

  const handleDoubleClick = (e: React.MouseEvent, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingItem(title)
    setEditValue(title)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setEditingItem(null)
    } else if (e.key === "Escape") {
      setEditingItem(null)
    }
  }

  const handleBlur = () => {
    setEditingItem(null)
  }

  const toggleAreaExpanded = (areaName: string) => {
    const isCurrentlyExpanded = expandedAreas[areaName]
    const newState = !isCurrentlyExpanded
    const area = projects.areas.find((a) => a.name === areaName)
    const totalItems = area?.lists.length || 0

    setAnimatingAreas((prev) => ({
      ...prev,
      [areaName]: newState ? "expanding" : "collapsing",
    }))

    setExpandedAreas((prev) => ({
      ...prev,
      [areaName]: newState,
    }))

    // Calculate total animation duration based on number of items
    const animationDuration = newState ? 300 + totalItems * 60 : 350 + 60

    setTimeout(() => {
      setAnimatingAreas((prev) => ({
        ...prev,
        [areaName]: "idle",
      }))
    }, animationDuration)
  }

  return (
    <SidebarGroup className="py-0">
      <div className="flex items-center px-2">
        <SidebarGroupLabel className="flex-1 flex items-center justify-between">
          <span>{projects.title}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-5 w-5 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-sm hover:bg-[#ececec] focus:outline-none"
                aria-label="Add project or area"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align={isMobile ? "end" : "start"}
            >
              <DropdownMenuItem onClick={createNewProject}>
                <span>New Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={createNewArea}>
                <span>New Area</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarGroupLabel>
      </div>
      {/* Add separator line beneath Projects header */}
      <div className="mx-2 mb-2">
        <div className="h-[1px] bg-[#EBEBEB]"></div>
      </div>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0">
          {/* Standalone lists - now rendered first */}
          {projects.standaloneLists.map((list) => (
            <ListItem
              key={list.name}
              list={list}
              editingItem={editingItem}
              inputRef={inputRef}
              editValue={editValue}
              onDoubleClick={handleDoubleClick}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
            />
          ))}

          {/* Add spacing between standalone lists and areas */}
          {projects.standaloneLists.length > 0 && projects.areas.length > 0 && (
            <div className="h-3" aria-hidden="true"></div>
          )}

          {/* Areas with nested lists - now rendered after standalone lists */}
          {projects.areas.map((area) => (
            <Collapsible
              key={area.name}
              open={expandedAreas[area.name]}
              onOpenChange={() => toggleAreaExpanded(area.name)}
              className="w-full"
            >
              <div className="flex items-center">
                <SidebarMenuItem className="flex-1 w-full">
                  <SidebarMenuButton tooltip={area.name} className="hover:bg-[#ececec] hover:rounded-md w-full">
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <Layers
                        className={`absolute h-4 w-4 transition-all duration-300 ease-in-out text-[#595959] ${
                          expandedAreas[area.name] ? "opacity-0 scale-90 rotate-12" : "opacity-100 scale-100 rotate-0"
                        }`}
                      />
                      <Layers2
                        className={`absolute h-4 w-4 transition-all duration-300 ease-in-out text-[#595959] ${
                          expandedAreas[area.name] ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-90 rotate-12"
                        }`}
                      />
                    </div>
                    {editingItem === area.name ? (
                      <input
                        ref={editingItem === area.name ? inputRef : undefined}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0"
                      />
                    ) : (
                      <span
                        className="font-medium text-[#595959]"
                        onDoubleClick={(e) => handleDoubleClick(e, area.name)}
                      >
                        {area.name}
                      </span>
                    )}
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      <DropdownMenuItem>
                        <span>Rename Area</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const areaId = Object.values(contextAreas).find((a) => a.name === area.name)?.id
                          if (areaId) {
                            createNewListInArea(areaId)
                          }
                        }}
                      >
                        <span>Add List</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <span>Delete Area</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <button
                    className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Toggle area"
                  >
                    <ChevronRight
                      className={`h-4 w-4 chevron-enhanced ${expandedAreas[area.name] ? "rotate-90" : ""}`}
                    />
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="collapsible-content-enhanced">
                <SidebarMenu className="gap-0.5 pl-2">
                  {area.lists.map((list, index) => (
                    <div
                      key={list.name}
                      className={cn(
                        animatingAreas[area.name] === "expanding" && "list-item-fade-in",
                        animatingAreas[area.name] === "collapsing" && "list-item-fade-out",
                      )}
                    >
                      <ListItem
                        list={list}
                        editingItem={editingItem}
                        inputRef={inputRef}
                        editValue={editValue}
                        onDoubleClick={handleDoubleClick}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                      />
                    </div>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function ListItem({
  list,
  editingItem,
  inputRef,
  editValue,
  onDoubleClick,
  onKeyDown,
  onBlur,
}: {
  list: { name: string; url: string }
  editingItem: string | null
  inputRef: React.RefObject<HTMLInputElement>
  editValue: string
  onDoubleClick: (e: React.MouseEvent, title: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onBlur: () => void
}) {
  const { setActiveListId, activeListId, getTasksForList } = useTaskContext()
  const { isDraggingTask } = useDragContext()
  const { isMobile } = useSidebar()
  const [isOver, setIsOver] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const listId = list.name.toLowerCase().replace(/\s+/g, "-")
  const { setNodeRef, isOver: dndIsOver } = useDroppable({
    id: `sidebar-${listId}`,
  })

  // Update isOver state when dndIsOver changes
  useEffect(() => {
    setIsOver(dndIsOver)
  }, [dndIsOver])

  // Determine if this item should show drop indicator
  const showDropIndicator = isDraggingTask && isOver

  // Get dynamic task count for this project
  const { data: dynamicCount = 0, isLoading: countLoading, error: countError } = useProjectTaskCount(listId)

  // Fallback to static count when dynamic count fails or for non-UUID project IDs
  const tasks = getTasksForList(listId)
  const staticCount = tasks.filter((task) => !task.checked).length

  // Check if this is a real database project (UUID format) vs mock data
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const isRealProject = uuidRegex.test(listId)

  // Use dynamic count for real projects, fallback to static count for mock data or on error
  const incompleteCount = (isRealProject && !countError) ? dynamicCount : staticCount

  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (editingItem === list.name) return // Don't navigate when editing
    setActiveListId(listId)
  }

  return (
    <SidebarMenuItem
      className={cn("w-full relative", showDropIndicator && "bg-blue-100 rounded-md border-2 border-blue-400")}
      ref={setNodeRef}
      data-droppable-id={`sidebar-${listId}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SidebarMenuButton
        asChild
        isActive={activeListId === listId}
        className={cn(
          "data-[active=true]:bg-[#e3e3e3] data-[active=true]:rounded-md hover:bg-[#ececec] hover:rounded-md w-full",
          showDropIndicator && "bg-blue-50",
        )}
      >
        <a href="#" onClick={handleItemClick}>
          <ListTodo className="h-4 w-4" />
          {editingItem === list.name ? (
            <input
              ref={editingItem === list.name ? inputRef : undefined}
              type="text"
              value={editValue}
              onChange={(e) => e.stopPropagation()}
              onKeyDown={onKeyDown}
              onBlur={onBlur}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent border-none outline-none focus:ring-0"
            />
          ) : (
            <span onDoubleClick={(e) => onDoubleClick(e, list.name)}>{list.name}</span>
          )}
        </a>
      </SidebarMenuButton>

      {/* Counter/Ellipsis positioned where SidebarMenuAction normally appears */}
      <div className="absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center">
        {isHovered ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align={isMobile ? "end" : "start"}
            >
              <DropdownMenuItem>
                <span>Rename List</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Move to Area</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>Delete List</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          (incompleteCount > 0 || (isRealProject && countLoading)) && (
            <span className="text-xs text-muted-foreground font-medium tabular-nums">
              {isRealProject && countLoading ? (
                <span className="animate-pulse">•</span>
              ) : (
                incompleteCount
              )}
            </span>
          )
        )}
      </div>

      {/* Remove the original DropdownMenu that was outside */}
    </SidebarMenuItem>
  )
}
