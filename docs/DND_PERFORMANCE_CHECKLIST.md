# Drag & Drop Performance Checklist (DnD Kit + React)

This guide documents the root causes, fixes, and best practices that resolved a drag-time UI freeze. Use it as a reference for future changes.

## Symptoms
- Reordering a task caused the UI to become unresponsive during drag and occasionally after drop
- Sidebar tabs and buttons appeared unclickable until a page refresh

## Root Causes
1) Global SortableContext wrapper: wrapping the whole app caused broad re-renders and measuring work on every drag frame
2) Per-frame work in drag handlers: console logging entire drag events; state churn inside onDragOver
3) Aggressive measuring strategy: MeasuringStrategy.Always increased layout/measure overhead
4) Non-memoized provider values: Drag context re-created values each render, propagating re-renders widely
5) Drag overlay interaction: overlay intercepting pointer events made UI feel frozen during and after drag

## Fixes (implemented)
- Move SortableContext to the feature boundary (per list) instead of the app provider
- Remove onDragMove logging; minimize work during onDragOver; delete droppableAreas map
- Use MeasuringStrategy.WhileDragging
- Memoize DragContext value with useMemo
- Set DragOverlay style pointer-events: none
- Reduce verbose per-drag logs in SortableTaskItem

## File-level notes
- components/task/drag-context.tsx
  - Removed global <SortableContext>
  - useDndMonitor: no onDragMove; quiet logs
  - handleDragOver: only update when changed; no droppableAreas
  - measuring: WhileDragging
  - Memoized context value
- components/task/task-list.tsx
  - Added local <SortableContext items={[...]} strategy={verticalListSortingStrategy}>
  - DragOverlay with pointer-events: none
- components/task/sortable-task-item.tsx
  - Removed heavy console logging during mount and onMouseDown
- components/task/scheduled-view.tsx
  - Added missing imports for SortableContext & strategy

## DnD Kit best practices
- Scope SortableContext to the smallest subtree (e.g., just the sortable rows)
- Keep onDragMove strictly visual (no state writes, no logs, no data work)
- Prefer MeasuringStrategy.WhileDragging for lists
- Avoid modifiers unless necessary; profile if you add any
- Keep collisionDetection simple (closestCenter or pointerWithin for lists)

## React best practices under drag
- Memoize context values and expensive props
- Avoid creating new objects in state every frame
- Prevent heavy logs in hot paths (logging serializes objects and triggers DevTools overhead)
- Reduce CSS transitions during drag (or disable transitions for the active item)

## Profiling quick-start (Chrome)
1. Performance tab → Record 3–5s drag → Stop
   - Look for long tasks (>50ms) in scripting/layout
   - Inspect stacks for noisy functions or global re-renders
2. React DevTools Profiler → Record drag → Stop
   - Verify only row items re-render frequently
   - App shell (sidebar, dialogs) should not re-render per frame

## Regression checklist (before merging drag changes)
- [ ] No logs inside onDragMove or high-frequency handlers
- [ ] SortableContext scoped to list rows
- [ ] DragOverlay pointer-events: none
- [ ] Measuring strategy WhileDragging (unless proven necessary otherwise)
- [ ] Drag provider value memoized
- [ ] No modifiers added without profiling
- [ ] React Profiler shows bounded re-renders during drag

## Pitfalls to avoid
- Global providers or wrappers that capture the entire layout in drag-time updates
- Using setState per frame in drag handlers
- Console logging event objects during drag

## Snippets (for reference)

drag-context.tsx (measuring + memoized value):

```tsx
measuring={{ droppable: { strategy: MeasuringStrategy.WhileDragging } }}

const contextValue = useMemo(() => ({
  activeTaskId, selectedTaskIds, isDraggingTask: !!activeTaskId,
  activeDroppableId, isDraggingOver, setSelectedTaskIds,
  isMultiDragging, dragType, sortableItems,
}), [activeTaskId, selectedTaskIds, activeDroppableId, isMultiDragging, dragType, sortableItems])
```

task-list.tsx (local SortableContext + overlay):

```tsx
<SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
  {tasks.map(task => /* render row */)}
</SortableContext>

<DragOverlay dropAnimation={null} style={{ pointerEvents: 'none' }}>
  {/* overlay content */}
</DragOverlay>
```

sortable-task-item.tsx (quiet hot paths):

```tsx
useEffect(() => {
  setIsClient(true)
  // console.debug('SortableTaskItem mounted', { id: props.id })
}, [])
```

## When to consider further tuning
- Very large lists: consider virtualization (e.g., react-virtual) and DnD virtualization patterns
- Complex collision/constraints: add modifiers incrementally and profile each addition
- Heavy drop logic: keep data mutations in onDragEnd with optimistic updates; avoid invalidations during drag

## Conclusion
These patterns resolved main-thread stalls during drag and kept the UI responsive. Revisit this checklist whenever modifying DnD behavior or structure.

