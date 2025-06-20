# Reorder API Documentation

## Overview

The Reorder API provides a unified endpoint for handling drag-and-drop reordering operations across tasks, project lists, and areas. It supports batch updates, cross-container moves, and maintains data consistency through database transactions.

## Endpoint

**PUT** `/api/reorder`

## Features

- **Batch Operations**: Update multiple items in a single request
- **Cross-container Moves**: Move items between different containers (e.g., tasks between projects)
- **Database Transactions**: Atomic operations ensure data consistency
- **Concurrency Control**: Handles simultaneous reordering requests
- **Action History**: Records operations for undo/redo functionality
- **Comprehensive Validation**: Prevents invalid moves and circular references

## Request Format

```json
{
  "type": "tasks" | "project_lists" | "areas",
  "moves": [
    {
      "id": "uuid",
      "sort_order": number,
      "parent_id": "uuid" | null
    }
  ]
}
```

### Parameters

- **type** (required): The entity type being reordered
  - `"tasks"` - Reorder tasks within or between project lists
  - `"project_lists"` - Reorder project lists within or between areas
  - `"areas"` - Reorder areas (no parent containers)

- **moves** (required): Array of move operations (1-100 items)
  - **id** (required): UUID of the item to move
  - **sort_order** (required): New sort position (non-negative integer)
  - **parent_id** (optional): New parent container ID, or null for no parent

## Response Format

### Success Response (200 OK)

```json
{
  "data": {
    "type": "tasks",
    "affectedIds": ["uuid1", "uuid2"],
    "moveCount": 2
  },
  "message": "Successfully reordered 2 tasks"
}
```

### Error Response (400/404/500)

```json
{
  "error": "API Error",
  "message": "Detailed error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Usage Examples

### Reorder Tasks Within Same Project

```javascript
const response = await fetch('/api/reorder', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'tasks',
    moves: [
      {
        id: 'task-1-uuid',
        sort_order: 0,
        parent_id: 'project-uuid'
      },
      {
        id: 'task-2-uuid',
        sort_order: 1,
        parent_id: 'project-uuid'
      }
    ]
  })
})
```

### Move Tasks Between Projects

```javascript
const response = await fetch('/api/reorder', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'tasks',
    moves: [
      {
        id: 'task-uuid',
        sort_order: 0,
        parent_id: 'new-project-uuid'
      }
    ]
  })
})
```

### Move Tasks to Inbox (No Project)

```javascript
const response = await fetch('/api/reorder', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'tasks',
    moves: [
      {
        id: 'task-uuid',
        sort_order: 0,
        parent_id: null
      }
    ]
  })
})
```

### Reorder Project Lists

```javascript
const response = await fetch('/api/reorder', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'project_lists',
    moves: [
      {
        id: 'project-1-uuid',
        sort_order: 0,
        parent_id: 'area-uuid'
      },
      {
        id: 'project-2-uuid',
        sort_order: 1,
        parent_id: null
      }
    ]
  })
})
```

### Reorder Areas

```javascript
const response = await fetch('/api/reorder', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'areas',
    moves: [
      {
        id: 'area-1-uuid',
        sort_order: 0,
        parent_id: null
      },
      {
        id: 'area-2-uuid',
        sort_order: 1,
        parent_id: null
      }
    ]
  })
})
```

## Validation Rules

### General Rules
- Maximum 100 moves per request
- All IDs must be valid UUIDs
- Sort orders must be non-negative integers
- User must own all entities being moved

### Entity-Specific Rules

#### Tasks
- Can be moved between project lists or to inbox (null parent)
- Parent ID must be a valid project list owned by the user

#### Project Lists
- Can be moved between areas or to root level (null parent)
- Parent ID must be a valid area owned by the user

#### Areas
- Cannot have parent containers (parent_id must be null)
- Only sort_order changes are allowed

## Error Codes

- **VALIDATION_ERROR**: Invalid request format or parameters
- **NOT_FOUND**: Entity not found or access denied
- **DATABASE_ERROR**: Database operation failed
- **INTERNAL_ERROR**: Unexpected server error

## Performance Considerations

- Batch operations are more efficient than individual updates
- Database indexes on sort_order fields optimize query performance
- Transactions ensure consistency but may impact concurrent operations
- Action history recording adds minimal overhead

## Security

- All operations require user authentication
- Users can only reorder their own entities
- Row Level Security (RLS) policies enforce access control
- Input validation prevents injection attacks

## Undo/Redo Support

All reorder operations are recorded in the action history table with:
- Batch ID for grouping related operations
- Original entity states for reversal
- Metadata for operation context

This enables comprehensive undo/redo functionality in the frontend.
