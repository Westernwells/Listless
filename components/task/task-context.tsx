"use client"

import type React from "react"

import { createContext, useContext, useState, type ReactNode } from "react"

// Sample data
const sampleTasks = {
  inbox: [
    {
      id: "task-1",
      content: "Evaluate Q1 Advertising Budget",
      checked: false,
      dueDate: "2024-05-31",
      flagged: true,
      tags: ["Marketing", "Strategy"],
    },
    {
      id: "task-2",
      content: "Review finances",
      checked: false,
      dueDate: "2024-05-05",
      flagged: true,
      tags: ["Marketing", "Strategy"],
    },
    {
      id: "task-3",
      content: "Speak to team",
      checked: false,
      dueDate: "2024-03-31",
      flagged: true,
      tags: ["Marketing", "Strategy"],
    },
    {
      id: "task-4",
      content: "Check with bank",
      checked: false,
      dueDate: "2024-04-25",
      flagged: true,
      tags: ["Marketing", "Strategy"],
    },
  ],
  today: [
    {
      id: "task-5",
      content: "Evaluate Q1 Advertising Budget",
      checked: false,
      dueDate: "2024-05-05",
      flagged: true,
      tags: ["Marketing", "Strategy"],
    },
    {
      id: "task-6",
      content: "Review finances",
      checked: false,
      dueDate: "2024-05-05",
      flagged: true,
      tags: ["Marketing", "Strategy"],
    },
  ],
  scheduled: [
    {
      id: "task-scheduled-1",
      content: "Test task",
      checked: false,
      dueDate: "2024-05-28", // Tomorrow
      flagged: false,
      tags: [],
    },
    {
      id: "task-10",
      content: "Task 10",
      checked: false,
      dueDate: "2024-06-05",
      flagged: false,
      tags: ["Make Pancakes Project"],
    },
    {
      id: "task-11",
      content: "test task",
      checked: false,
      dueDate: "2024-07-15",
      flagged: false,
      tags: ["Inbox"],
    },
    {
      id: "task-12",
      content: "Task 5",
      checked: false,
      dueDate: "2024-08-06",
      flagged: false,
      tags: ["React Build Project"],
    },
  ],
  "list-a": [
    {
      id: "task-7",
      content: "Create project plan",
      checked: true,
      dueDate: "2024-05-07",
      flagged: false,
      tags: ["Planning", "Area 1"],
    },
    {
      id: "task-8",
      content: "Schedule kickoff meeting",
      checked: false,
      dueDate: "2024-05-08",
      flagged: true,
      tags: ["Planning", "Area 1"],
    },
  ],
  "list-b": [
    {
      id: "task-9",
      content: "Research competitors",
      checked: false,
      dueDate: "2024-05-09",
      flagged: false,
      tags: ["Research", "Area 1"],
    },
  ],
  // Add completed tasks to the completed list instead
  completed: [
    {
      id: "task-16",
      content: "Completed task 1",
      checked: true,
      completedAt: "2024-05-01",
      tags: ["Completed"],
    },
    {
      id: "task-17",
      content: "Completed task 2",
      checked: true,
      completedAt: "2024-05-02",
      tags: ["Completed"],
    },
  ],
  trash: [
    {
      id: "trash-1",
      content: "Deleted task 1",
      checked: false,
      isTrashed: true,
      tags: ["Deleted"],
    },
    {
      id: "trash-2",
      content: "Deleted task 2",
      checked: true,
      isTrashed: true,
      tags: ["Deleted"],
    },
  ],
}

// Sample projects data
const sampleProjects = {
  "list-a": {
    id: "list-a",
    name: "List A",
    description: "",
    areaId: "area-1",
  },
  "list-b": {
    id: "list-b",
    name: "List B",
    description: "",
    areaId: "area-1",
  },
  "list-c": {
    id: "list-c",
    name: "List C",
    description: "",
    areaId: "area-2",
  },
  "list-d": {
    id: "list-d",
    name: "List D",
    description: "",
    areaId: "area-2",
  },
  "list-e": {
    id: "list-e",
    name: "List E",
    description: "",
    areaId: null,
  },
  "test-project": {
    id: "test-project",
    name: "Test Project",
    description: "A test project for the scheduled view",
    areaId: null,
    whenDate: "2024-05-30", // Friday
    tags: ["Freelancer", "Urgent", "Timely"],
  },
}

// Sample areas data
const sampleAreas = {
  "area-1": {
    id: "area-1",
    name: "Area 1",
    isCollapsed: false,
  },
  "area-2": {
    id: "area-2",
    name: "Area 2",
    isCollapsed: false,
  },
}

export interface TaskTag {
  id: string
  name: string
  color?: string
}

export interface Task {
  id: string
  content: string
  checked: boolean
  dueDate?: string
  deferDate?: string
  flagged?: boolean
  priority?: string | null
  tags?: TaskTag[]
  notes?: string
  completedAt?: string
  isTrashed?: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  areaId: string | null
  whenDate?: string // Add this line
  tags?: string[]
}

export interface Area {
  id: string
  name: string
  isCollapsed: boolean
}

type TaskListId = string
type ViewType = "list" | "scheduled" | "trash" | "settings"

type TaskContextType = {
  activeListId: TaskListId | null
  setActiveListId: (id: TaskListId | null) => void
  getTasksForList: (id: TaskListId) => Task[]
  getListTitle: (id: TaskListId) => string
  currentView: ViewType
  allTasks: Task[]
  toggleTask: (id: string) => void
  addTask: (listId: string, task: Partial<Task>) => void
  duplicateTask: (taskId: string) => void
  updateTaskDueDate: (taskId: string, dueDate: string) => void
  deleteTask: (taskId: string) => void
  setTaskTags: (taskId: string, tags: string[]) => void
  findTaskList: (taskId: string) => string | null
  updateTask: (taskId: string, updates: Partial<Task>) => void
  restoreTask: (taskId: string) => void
  permanentlyDeleteTask: (taskId: string) => void
  emptyTrash: () => void
  convertTaskToProject: (taskId: string, projectName: string, areaId: string | null) => void
  getProject: (projectId: string) => Project | null
  updateProject: (projectId: string, updates: Partial<Project>) => void
  projects: Record<string, Project>
  areas: Record<string, Area>
  moveTaskToList: (taskId: string, targetListId: string) => void
  moveTasksToList: (taskIds: string[], targetListId: string) => void
  setProjects: React.Dispatch<React.SetStateAction<Record<string, Project>>>
  setTasks: React.Dispatch<React.SetStateAction<any>>
  setAreas: React.Dispatch<React.SetStateAction<Record<string, Area>>>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [activeListId, setActiveListId] = useState<TaskListId | null>("inbox")
  const [tasks, setTasks] = useState(sampleTasks)
  const [projects, setProjects] = useState(sampleProjects)
  const [areas, setAreas] = useState(sampleAreas)
  const [currentView, setCurrentView] = useState<ViewType>("list")

  const getTasksForList = (id: TaskListId): Task[] => {
    return tasks[id as keyof typeof tasks] || []
  }

  const getListTitle = (id: TaskListId): string => {
    const titles: Record<string, string> = {
      inbox: "Inbox",
      today: "Today",
      scheduled: "Scheduled",
      deferred: "Deferred",
      completed: "Completed",
      trash: "Trash",
    }

    // If it's a project ID, return the project name
    if (projects[id]) {
      return projects[id].name
    }

    return titles[id] || "Tasks"
  }

  // Get all tasks across all lists
  const allTasks = Object.values(tasks).flat()

  // Find which list contains a task
  const findTaskList = (taskId: string): string | null => {
    for (const listId in tasks) {
      const listTasks = tasks[listId as keyof typeof tasks]
      if (listTasks.some((task) => task.id === taskId)) {
        return listId
      }
    }
    return null
  }

  // Toggle task completion
  const toggleTask = (id: string) => {
    setTasks(currentTasks => {
      const newTasks = JSON.parse(JSON.stringify(currentTasks));
      let taskToMove: Task | null = null;
      let sourceListId: string | null = null;

      // Find the task and its source list
      for (const listId in newTasks) {
        // Ensure we are checking a valid list, which should be an array
        if (Array.isArray(newTasks[listId])) {
          const taskIndex = newTasks[listId].findIndex((task: Task) => task.id === id);
          if (taskIndex !== -1) {
            sourceListId = listId;
            taskToMove = newTasks[listId].splice(taskIndex, 1)[0];
            break;
          }
        }
      }

      if (taskToMove && sourceListId) {
        // If task is being marked as complete
        if (!taskToMove.checked) {
          taskToMove.checked = true;
          taskToMove.completedAt = new Date().toISOString();

          // Move completed tasks to a temporary logbook list for local state management
          if (!newTasks.logbook) {
            newTasks.logbook = [];
          }
          newTasks.logbook.push(taskToMove);
        } else {
          // If task is being marked as incomplete
          taskToMove.checked = false;
          taskToMove.completedAt = undefined;
          // Move it back to the 'inbox' list
          if (!newTasks.inbox) {
            newTasks.inbox = [];
          }
          newTasks.inbox.push(taskToMove);
        }
      }

      return newTasks;
    });
  };

  // Add a new task
  const addTask = (listId: string, taskData: Partial<Task>) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      content: taskData.content || "New Task",
      checked: false,
      dueDate: taskData.dueDate,
      flagged: taskData.flagged || false,
      tags: taskData.tags || [],
    }

    setTasks((prev) => ({
      ...prev,
      [listId]: [...(prev[listId as keyof typeof prev] || []), newTask],
    }))
  }

  // Duplicate a task
  const duplicateTask = (taskId: string) => {
    // Find the task to duplicate
    let taskToDuplicate: Task | null = null
    let listId: string | null = null

    // Find which list contains the task
    for (const id in tasks) {
      const listTasks = tasks[id as keyof typeof tasks]
      const task = listTasks.find((t) => t.id === taskId)

      if (task) {
        taskToDuplicate = task
        listId = id
        break
      }
    }

    if (taskToDuplicate && listId) {
      // Create a duplicate with a new ID
      const duplicatedTask: Task = {
        ...taskToDuplicate,
        id: `task-${Date.now()}`,
        content: `${taskToDuplicate.content} (Copy)`,
      }

      // Add the duplicated task to the same list
      setTasks((prev) => ({
        ...prev,
        [listId as keyof typeof prev]: [...prev[listId as keyof typeof prev], duplicatedTask],
      }))
    }
  }

  // Update task due date
  const updateTaskDueDate = (taskId: string, dueDate: string) => {
    const updatedTasks = { ...tasks }

    // Find which list contains the task
    for (const listId in updatedTasks) {
      const listTasks = updatedTasks[listId as keyof typeof updatedTasks]
      const taskIndex = listTasks.findIndex((task) => task.id === taskId)

      if (taskIndex !== -1) {
        // Update the due date
        listTasks[taskIndex] = {
          ...listTasks[taskIndex],
          dueDate,
        }
        break
      }
    }

    setTasks(updatedTasks)
  }

  // Delete a task (move to trash)
  const deleteTask = (taskId: string) => {
    const updatedTasks = { ...tasks }
    let taskToDelete: Task | null = null

    // Find which list contains the task and remove it
    for (const listId in updatedTasks) {
      if (listId === "trash") continue // Skip the trash list

      const listTasks = updatedTasks[listId as keyof typeof updatedTasks]
      const taskIndex = listTasks.findIndex((task) => task.id === taskId)

      if (taskIndex !== -1) {
        // Get the task and remove it from the list
        taskToDelete = { ...listTasks[taskIndex], isTrashed: true }
        listTasks.splice(taskIndex, 1)
        break
      }
    }

    // Add the task to the trash
    if (taskToDelete) {
      updatedTasks.trash = [...updatedTasks.trash, taskToDelete]
    }

    setTasks(updatedTasks)
  }

  // Restore a task from trash
  const restoreTask = (taskId: string) => {
    const updatedTasks = { ...tasks }
    const trashIndex = updatedTasks.trash.findIndex((task) => task.id === taskId)

    if (trashIndex !== -1) {
      // Get the task and remove it from trash
      const taskToRestore = { ...updatedTasks.trash[trashIndex], isTrashed: false }
      updatedTasks.trash.splice(trashIndex, 1)

      // Add the task back to inbox
      updatedTasks.inbox = [...updatedTasks.inbox, taskToRestore]
    }

    setTasks(updatedTasks)
  }

  // Permanently delete a task
  const permanentlyDeleteTask = (taskId: string) => {
    const updatedTasks = { ...tasks }

    // Remove from trash
    updatedTasks.trash = updatedTasks.trash.filter((task) => task.id !== taskId)

    setTasks(updatedTasks)
  }

  // Empty trash
  const emptyTrash = () => {
    const updatedTasks = { ...tasks, trash: [] }
    setTasks(updatedTasks)
  }

  // Set task tags
  const setTaskTags = (taskId: string, tags: string[]) => {
    const updatedTasks = { ...tasks }

    // Find which list contains the task
    for (const listId in updatedTasks) {
      const listTasks = updatedTasks[listId as keyof typeof updatedTasks]
      const taskIndex = listTasks.findIndex((task) => task.id === taskId)

      if (taskIndex !== -1) {
        // Update the tags
        listTasks[taskIndex] = {
          ...listTasks[taskIndex],
          tags,
        }
        break
      }
    }

    setTasks(updatedTasks)
  }

  // Update task properties
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = { ...tasks }

    // Find which list contains the task
    for (const listId in updatedTasks) {
      const listTasks = updatedTasks[listId as keyof typeof updatedTasks]
      const taskIndex = listTasks.findIndex((task) => task.id === taskId)

      if (taskIndex !== -1) {
        // Update the task with the new properties
        listTasks[taskIndex] = {
          ...listTasks[taskIndex],
          ...updates,
        }
        break
      }
    }

    setTasks(updatedTasks)
  }

  // Convert a task to a project
  const convertTaskToProject = (taskId: string, projectName: string, areaId: string | null) => {
    // Find the task
    let taskToConvert: Task | null = null
    let listId: string | null = null

    // Find which list contains the task
    for (const id in tasks) {
      const listTasks = tasks[id as keyof typeof tasks]
      const taskIndex = listTasks.findIndex((task) => task.id === taskId)

      if (taskIndex !== -1) {
        taskToConvert = listTasks[taskIndex]
        listId = id
        break
      }
    }

    if (taskToConvert && listId) {
      // Create a new project
      const newProjectId = `project-${Date.now()}`
      const newProject: Project = {
        id: newProjectId,
        name: projectName,
        description: taskToConvert.notes || "",
        areaId,
        tags: taskToConvert.tags,
      }

      // Add the project
      setProjects((prev) => ({
        ...prev,
        [newProjectId]: newProject,
      }))

      // Remove the task from its list
      setTasks((prev) => {
        const updatedTasks = { ...prev }
        const listTasks = [...updatedTasks[listId as keyof typeof updatedTasks]]
        const taskIndex = listTasks.findIndex((task) => task.id === taskId)

        if (taskIndex !== -1) {
          listTasks.splice(taskIndex, 1)
          updatedTasks[listId as keyof typeof updatedTasks] = listTasks
        }

        // Create an empty task list for the new project
        updatedTasks[newProjectId] = []

        return updatedTasks
      })

      // Set the active list to the new project
      setActiveListId(newProjectId)
    }
  }

  // Get a project by ID
  const getProject = (projectId: string): Project | null => {
    return projects[projectId] || null
  }

  // Update project properties
  const updateProject = (projectId: string, updates: Partial<Project>) => {
    if (projects[projectId]) {
      setProjects((prev) => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          ...updates,
        },
      }))
    }
  }

  // Move a task from one list to another
  const moveTaskToList = (taskId: string, targetListId: string) => {
    console.log(`Moving task ${taskId} to list ${targetListId}`)

    const updatedTasks = { ...tasks }
    let taskToMove: Task | null = null
    let sourceListId: string | null = null

    // Find which list contains the task
    for (const listId in updatedTasks) {
      const listTasks = updatedTasks[listId as keyof typeof updatedTasks]
      const taskIndex = listTasks.findIndex((task) => task.id === taskId)

      if (taskIndex !== -1) {
        // Get the task and remove it from the source list
        taskToMove = { ...listTasks[taskIndex] }
        listTasks.splice(taskIndex, 1)
        sourceListId = listId
        break
      }
    }

    // Add the task to the target list if it exists
    if (taskToMove && sourceListId) {
      // Make sure the target list exists
      if (!updatedTasks[targetListId as keyof typeof updatedTasks]) {
        // Create the list if it doesn't exist
        updatedTasks[targetListId as keyof typeof updatedTasks] = []
      }

      // Add the task to the target list
      updatedTasks[targetListId as keyof typeof updatedTasks] = [
        ...updatedTasks[targetListId as keyof typeof updatedTasks],
        taskToMove,
      ]

      console.log(`Task moved from ${sourceListId} to ${targetListId}`)
    } else {
      console.error("Failed to move task: Task or source list not found")
    }

    setTasks(updatedTasks)
  }

  // Move multiple tasks from their respective lists to a target list
  const moveTasksToList = (taskIds: string[], targetListId: string) => {
    console.log(`Moving multiple tasks to list ${targetListId}:`, taskIds)

    if (taskIds.length === 0) return

    const updatedTasks = { ...tasks }
    const tasksToMove: { task: Task; sourceListId: string }[] = []

    // First, find all tasks and remove them from their source lists
    for (const taskId of taskIds) {
      for (const listId in updatedTasks) {
        const listTasks = updatedTasks[listId as keyof typeof updatedTasks]
        const taskIndex = listTasks.findIndex((task) => task.id === taskId)

        if (taskIndex !== -1) {
          // Get the task and remove it from the source list
          const task = { ...listTasks[taskIndex] }
          listTasks.splice(taskIndex, 1)

          // Store the task and its source list
          tasksToMove.push({ task, sourceListId: listId })
          break
        }
      }
    }

    // Make sure the target list exists
    if (!updatedTasks[targetListId as keyof typeof updatedTasks]) {
      updatedTasks[targetListId as keyof typeof updatedTasks] = []
    }

    // Add all tasks to the target list
    for (const { task } of tasksToMove) {
      updatedTasks[targetListId as keyof typeof updatedTasks].push(task)
    }

    console.log(`Moved ${tasksToMove.length} tasks to ${targetListId}`)
    setTasks(updatedTasks)
  }

  // Update current view based on active list
  const handleSetActiveListId = (id: TaskListId | null) => {
    setActiveListId(id)

    // Set view type based on list ID
    if (id === "trash") {
      setCurrentView("trash")
    } else if (id === "scheduled") {
      setCurrentView("scheduled")
    } else if (id === "settings") {
      setCurrentView("settings")
    } else {
      setCurrentView("list")
    }
  }

  return (
    <TaskContext.Provider
      value={{
        activeListId,
        setActiveListId: handleSetActiveListId,
        getTasksForList,
        getListTitle,
        currentView,
        allTasks,
        toggleTask,
        addTask,
        duplicateTask,
        updateTaskDueDate,
        deleteTask,
        setTaskTags,
        findTaskList,
        updateTask,
        restoreTask,
        permanentlyDeleteTask,
        emptyTrash,
        convertTaskToProject,
        getProject,
        updateProject,
        projects,
        areas,
        moveTaskToList,
        moveTasksToList,
        setProjects,
        setTasks,
        setAreas,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider")
  }
  return context
}
