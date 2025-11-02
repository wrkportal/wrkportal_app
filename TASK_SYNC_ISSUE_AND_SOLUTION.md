# 🔧 Task Sync Issue - Planning Tab WBS vs Database Tasks

## ❌ **Current Problem**

### Issue 1: Tasks Not Showing in Gantt Chart
- **Root Cause**: WBS tasks in Planning tab are stored in `planningData` JSON field
- **API Endpoint**: `/api/projects/[id]/tasks` queries the `Task` table, not JSON fields
- **Result**: Gantt chart dropdown shows empty even though WBS has tasks

### Issue 2: Tasks Not Syncing
- **Planning Tab WBS**: Tasks stored in `project.planningData.wbsTasks` (JSON)
- **My Tasks Page**: Queries `Task` table from database
- **Result**: Tasks created in either place don't appear in the other

## 🏗️ **Current Architecture**

### Planning Tab (WBS):
```typescript
// Data structure in planningData JSON
{
  wbsTasks: [
    {
      id: 'task-123',
      milestone: 'Phase 1',
      task: 'Design',
      subtask: 'Wireframes',
      assignedTo: 'user-id',
      start: '2025-01-01',
      end: '2025-01-15',
      status: 'In Progress',
      dependency: '',
      subtasks: [...]
    }
  ]
}
```

### Database Task Table:
```typescript
model Task {
  id          String
  tenantId    String
  projectId   String?
  title       String
  description String?
  status      TaskStatus
  assigneeId  String?
  startDate   DateTime?
  dueDate     DateTime?
  parentId    String?  // for subtasks
  tags        String[]
  ...
}
```

## ✅ **Solution Options**

### Option A: Sync WBS to Database Tasks (Recommended)
**When**: User saves Planning tab
**Action**: Convert WBS tasks to real Task records

**Pros:**
- ✅ Tasks appear in My Tasks
- ✅ Tasks appear in Gantt chart
- ✅ Tasks can be tracked/updated
- ✅ Proper database relationships

**Cons:**
- ⚠️ Requires migration logic
- ⚠️ Need to handle bidirectional sync

### Option B: Update Gantt Chart to Read JSON
**When**: User expands project
**Action**: Fetch both Task table AND planningData.wbsTasks

**Pros:**
- ✅ Quick fix
- ✅ No data migration needed

**Cons:**
- ❌ Tasks still won't appear in My Tasks
- ❌ No proper task management
- ❌ Two sources of truth

### Option C: Hybrid Approach (Best)
**When**: User saves Planning tab
**Action**: 
1. Keep WBS in JSON for planning view
2. Auto-create Task records for tracking
3. Link them with a `sourceType` field

**Pros:**
- ✅ Best of both worlds
- ✅ Planning tab keeps flexibility
- ✅ Tasks properly tracked
- ✅ Appears everywhere

## 🔨 **Implementation Plan (Option C)**

### Step 1: Add Source Tracking
```typescript
// Add to Task table
model Task {
  // ... existing fields
  sourceType  String?  // 'WBS', 'MANUAL', 'IMPORTED'
  sourceId    String?  // Reference to WBS task ID
}
```

### Step 2: Update Planning Tab Save
```typescript
// In planning-tab.tsx savePlanningData()
const syncWBSTasksToDatabase = async (wbsTasks) => {
  for (const wbsTask of wbsTasks) {
    // Check if Task record exists
    const existingTask = await fetch(`/api/tasks/by-source/${wbsTask.id}`)
    
    if (existingTask) {
      // Update existing
      await fetch(`/api/tasks/${existingTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: `${wbsTask.milestone} - ${wbsTask.task}`,
          startDate: wbsTask.start,
          dueDate: wbsTask.end,
          status: mapWBSStatus(wbsTask.status),
          assigneeId: wbsTask.assignedTo,
        })
      })
    } else {
      // Create new
      await fetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          projectId: projectId,
          title: `${wbsTask.milestone} - ${wbsTask.task}`,
          startDate: wbsTask.start,
          dueDate: wbsTask.end,
          status: mapWBSStatus(wbsTask.status),
          assigneeId: wbsTask.assignedTo,
          sourceType: 'WBS',
          sourceId: wbsTask.id,
          tags: wbsTask.milestone ? ['MILESTONE'] : [],
        })
      })
    }
    
    // Handle subtasks recursively
    if (wbsTask.subtasks) {
      syncWBSTasksToDatabase(wbsTask.subtasks, parentTaskId)
    }
  }
}
```

### Step 3: Status Mapping
```typescript
const mapWBSStatus = (wbsStatus: string): TaskStatus => {
  const mapping = {
    'Pending': 'TODO',
    'In Progress': 'IN_PROGRESS',
    'Completed': 'DONE',
    'On Hold': 'BLOCKED',
  }
  return mapping[wbsStatus] || 'TODO'
}
```

### Step 4: Bidirectional Sync
```typescript
// When task updated in My Tasks, update WBS
// In task update API
if (task.sourceType === 'WBS') {
  // Update planningData.wbsTasks array
  await updateWBSTaskInJSON(task.projectId, task.sourceId, taskUpdates)
}
```

## 📋 **Files to Modify**

1. **prisma/schema.prisma**
   - Add `sourceType` and `sourceId` to Task model

2. **components/project-tabs/planning-tab.tsx**
   - Add `syncWBSTasksToDatabase()` function
   - Call on save

3. **app/api/tasks/route.ts**
   - Handle sourceType in create
   - Add bidirectional sync

4. **app/api/projects/[id]/tasks/route.ts**
   - Already works! Just need to create real tasks

5. **components/roadmap/gantt-chart.tsx**
   - Already works! Will show tasks once synced

## 🎯 **Quick Fix (Immediate)**

For now, to see tasks in Gantt chart, modify the API to also fetch WBS tasks:

```typescript
// app/api/projects/[id]/tasks/route.ts
export async function GET(req, { params }) {
  // ... existing code to fetch Task records

  // Also fetch WBS tasks from planningData
  const project = await prisma.project.findUnique({
    where: { id },
    select: { planningData: true }
  })

  const wbsTasks = project.planningData?.deliverables?.find(
    d => d.id === '1'
  )?.wbsTasks || []

  // Convert WBS to Task format
  const convertedWBSTasks = wbsTasks.map(wbs => ({
    id: wbs.id,
    title: `${wbs.milestone} - ${wbs.task}`,
    status: mapWBSStatus(wbs.status),
    startDate: wbs.start ? new Date(wbs.start) : null,
    dueDate: wbs.end ? new Date(wbs.end) : null,
    parentId: null,
    tags: wbs.milestone ? ['MILESTONE'] : [],
    progress: wbs.status === 'Completed' ? 100 : 50,
  }))

  return NextResponse.json({ 
    tasks: [...tasks, ...convertedWBSTasks] 
  })
}
```

This will make Gantt chart work immediately, then implement proper sync later!

## ⚡ **Decision Required**

Which approach do you want?
1. **Quick Fix** - Update API to read WBS JSON (30 min)
2. **Proper Solution** - Implement full sync system (2-3 hours)
3. **Both** - Quick fix now, proper solution later

Let me know and I'll implement it! 🚀

