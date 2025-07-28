# Task Management API Documentation

This document describes the core task management API endpoints implemented for the Listless application.

## Overview

The API provides comprehensive task management functionality including:
- Creating, reading, updating, and deleting tasks
- Task duplication and conversion to projects
- Trash management (soft delete/restore)
- Permanent deletion
- Drag-and-drop reordering with cross-container moves
- AI-powered embedding generation for auto-tagging
- Action history tracking for undo/redo functionality

## Authentication

All endpoints require authentication via Supabase Auth. Include the user's session token in requests.

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### 1. Create Task

**POST** `/tasks`

Creates a new task with optional AI embedding generation.

**Request Body:**
```json
{
  "title": "Task title (required, max 500 chars)",
  "description": "Task description (optional)",
  "priority": "low|medium|high (default: medium)",
  "due_date": "ISO 8601 datetime (optional)",
  "project_list_id": "UUID of project (optional)",
  "sort_order": "Integer for ordering (default: 0)"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "task-uuid",
    "title": "Task title",
    "description": "Task description",
    "priority": "medium",
    "completed": false,
    "due_date": null,
    "project_list_id": null,
    "user_id": "user-uuid",
    "embedding": [0.1, 0.2, ...], // AI embedding vector
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "project_lists": null
  },
  "message": "Task created successfully"
}
```

### 2. List Tasks

**GET** `/tasks`

Retrieves tasks with optional filtering and pagination.

**Query Parameters:**
- `project_list_id` (UUID): Filter by project
- `include_completed` (boolean): Include completed tasks
- `include_deleted` (boolean): Include deleted tasks
- `limit` (integer, 1-100): Number of tasks to return
- `offset` (integer): Pagination offset

**Response (200):**
```json
{
  "data": [
    {
      "id": "task-uuid",
      "title": "Task title",
      // ... other task fields
      "project_lists": {
        "id": "project-uuid",
        "name": "Project name",
        "color": "#ff0000"
      },
      "task_tags": [
        {
          "tags": {
            "id": "tag-uuid",
            "name": "Tag name",
            "color": "#00ff00"
          },
          "is_ai_suggested": true,
          "confidence_score": 0.95
        }
      ]
    }
  ],
  "message": "Tasks retrieved successfully",
  "meta": {
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

### 3. Get Task

**GET** `/tasks/{id}`

Retrieves a specific task by ID.

**Response (200):**
```json
{
  "data": {
    // Task object with related data
  },
  "message": "Task retrieved successfully"
}
```

### 4. Update Task

**PUT** `/tasks/{id}`

Updates a task with partial data. Regenerates AI embedding if title or description changes.

**Request Body:**
```json
{
  "title": "Updated title (optional)",
  "description": "Updated description (optional)",
  "completed": true,
  "priority": "high",
  "due_date": "2024-12-31T23:59:59Z",
  "project_list_id": "new-project-uuid",
  "sort_order": 5
}
```

**Response (200):**
```json
{
  "data": {
    // Updated task object
  },
  "message": "Task updated successfully"
}
```

### 5. Delete Task (Move to Trash)

**DELETE** `/tasks/{id}`

Soft deletes a task (moves to trash).

**Response (200):**
```json
{
  "data": {
    "id": "task-uuid",
    "deleted": true
  },
  "message": "Task moved to trash successfully"
}
```

### 6. Duplicate Task

**POST** `/tasks/{id}/duplicate`

Creates a copy of an existing task.

**Response (201):**
```json
{
  "data": {
    // New task object with "(Copy)" appended to title
  },
  "message": "Task duplicated successfully"
}
```

### 7. Convert Task to Project

**POST** `/tasks/{id}/convert-to-project`

Converts a task into a project and updates the original task.

**Request Body:**
```json
{
  "project_name": "New project name (required)",
  "area_id": "area-uuid (optional)",
  "description": "Project description (optional)",
  "color": "#ff0000 (optional, hex color)"
}
```

**Response (201):**
```json
{
  "data": {
    "project": {
      // New project object
    },
    "task": {
      // Updated task object now linked to project
    }
  },
  "message": "Task converted to project successfully"
}
```

### 8. Get Trashed Tasks

**GET** `/tasks/restore`

Retrieves all tasks in trash.

**Response (200):**
```json
{
  "data": {
    "trashed_tasks": [
      // Array of deleted tasks
    ],
    "count": 5
  },
  "message": "Trashed tasks retrieved successfully"
}
```

### 9. Restore Tasks

**POST** `/tasks/restore`

Restores tasks from trash.

**Request Body:**
```json
{
  "task_ids": ["task-uuid-1", "task-uuid-2"]
}
```

**Response (200):**
```json
{
  "data": {
    "restored_tasks": [
      // Array of restored tasks
    ],
    "count": 2
  },
  "message": "2 task(s) restored successfully"
}
```

### 10. Get Permanent Delete Info

**GET** `/tasks/permanent`

Gets count of tasks that can be permanently deleted.

**Response (200):**
```json
{
  "data": {
    "trashed_count": 5,
    "can_delete_all": true
  },
  "message": "Trashed tasks count retrieved successfully"
}
```

### 11. Permanently Delete Tasks

**DELETE** `/tasks/permanent`

Permanently deletes trashed tasks.

**Request Body:**
```json
{
  "task_ids": ["task-uuid-1", "task-uuid-2"], // Optional: specific tasks
  "delete_all": true // Optional: delete all trashed tasks
}
```

**Response (200):**
```json
{
  "data": {
    "deleted_count": 5,
    "deleted_task_ids": ["task-uuid-1", "task-uuid-2", ...]
  },
  "message": "5 task(s) permanently deleted"
}
```

### 12. Reorder Items

**PUT** `/reorder`

Handles batch reordering operations for tasks, project lists, and areas with support for cross-container moves.

**Request Body:**
```json
{
  "type": "tasks|project_lists|areas",
  "moves": [
    {
      "id": "item-uuid",
      "sort_order": 0,
      "parent_id": "parent-uuid" // or null
    }
  ]
}
```

**Response (200):**
```json
{
  "data": {
    "type": "tasks",
    "affectedIds": ["item-uuid-1", "item-uuid-2"],
    "moveCount": 2
  },
  "message": "Successfully reordered 2 tasks"
}
```

**Features:**
- Batch operations (1-100 items per request)
- Cross-container moves (e.g., tasks between projects)
- Database transactions for consistency
- Action history recording for undo/redo
- Comprehensive validation

See [REORDER_API.md](./REORDER_API.md) for detailed documentation.

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "API Error",
  "message": "Human-readable error message",
  "details": {}, // Additional error details (optional)
  "code": "ERROR_CODE" // Machine-readable error code (optional)
}
```

### Common Error Codes

- `AUTH_REQUIRED` (401): Authentication required
- `VALIDATION_ERROR` (422): Request validation failed
- `NOT_FOUND` (404): Resource not found
- `DATABASE_ERROR` (500): Database operation failed
- `INTERNAL_ERROR` (500): Internal server error

## Features

### AI Embeddings
- Automatically generates embeddings for task content using OpenAI's text-embedding-3-small model
- Used for AI-powered auto-tagging and semantic search
- Regenerated when task title or description changes significantly

### Action History
- All operations are recorded in action_history table
- Enables undo/redo functionality
- Includes old and new data for reversible operations

### Row Level Security
- All database operations respect Supabase RLS policies
- Users can only access their own tasks
- Automatic user_id filtering on all queries

### Validation
- Comprehensive input validation using Zod schemas
- Type-safe request/response handling
- Detailed validation error messages
