# Task Completion Workflow Test Plan

## Test Scenarios

### 1. Basic Task Completion Test
**Steps:**
1. Navigate to Inbox view
2. Create a new task: "Test Task Completion"
3. Check the task checkbox to mark it as completed
4. **Expected Result**: Task should immediately disappear from Inbox view
5. Navigate to Completed view
6. **Expected Result**: Task should appear in Completed view

### 2. Cross-View Consistency Test
**Steps:**
1. Navigate to Today view
2. Create a task with today's date: "Today Task Test"
3. Mark the task as completed
4. **Expected Result**: Task disappears from Today view immediately
5. Navigate to Completed view
6. **Expected Result**: Task appears in Completed view
7. Navigate back to Today view
8. **Expected Result**: Task is not visible in Today view

### 3. Task Uncomplete Test
**Steps:**
1. Navigate to Completed view
2. Find a completed task
3. Uncheck the task checkbox
4. **Expected Result**: Task should immediately disappear from Completed view
5. Navigate to Inbox view
6. **Expected Result**: Task should appear back in Inbox view

### 4. Completed View Filtering Test
**Steps:**
1. Navigate to Completed view
2. Test Sort dropdown:
   - Select "Newest" - tasks should be sorted by completion date (newest first)
   - Select "Oldest" - tasks should be sorted by completion date (oldest first)
3. Test Filter dropdown:
   - Select "Today" - only tasks completed today should show
   - Select "This Week" - only tasks completed this week should show
   - Select "All time" - all completed tasks should show

### 5. Performance Test
**Steps:**
1. Create multiple tasks (5-10)
2. Rapidly check/uncheck tasks
3. **Expected Result**: All UI updates should be instant with no delays
4. Navigate between views while toggling tasks
5. **Expected Result**: Views should update immediately without lag

## Technical Verification

### API Calls to Monitor
- `GET /api/tasks` - Should return incomplete tasks only
- `GET /api/tasks?include_completed=true` - Should return completed tasks
- `PUT /api/tasks/[id]` - Should update task completion status

### Console Logs to Check
- No errors related to cache updates
- No warnings about missing task data
- TanStack Query should show successful mutations

### Cache Behavior
- Main tasks cache should remove completed tasks
- Completed tasks cache should add completed tasks
- Cross-cache synchronization should work seamlessly

## Known Issues Fixed

1. ✅ **Optimistic Updates**: Fixed cache management to properly handle task removal/addition
2. ✅ **Cross-Cache Sync**: Enhanced useToggleTask to update both main and completed caches
3. ✅ **Completion Timestamps**: Added proper completed_at handling
4. ✅ **View Consistency**: Ensured TaskList component is used consistently
5. ✅ **API Integration**: Fixed getCompletedTasks service method

## Success Criteria

- [ ] Tasks disappear instantly from current view when completed
- [ ] Completed tasks appear immediately in Completed view
- [ ] Task uncomplete works in reverse (completed → incomplete)
- [ ] All views (Inbox, Today, Completed) show consistent behavior
- [ ] Sort and filter controls work in Completed view
- [ ] No console errors or API failures
- [ ] Performance is smooth with no UI delays
