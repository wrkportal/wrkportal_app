# 🔍 WBS Sync Troubleshooting Guide

## Issue: Task added in WBS but not showing in My Tasks

### Step 1: Check if you clicked "Save"

**Important:** Adding a task in the WBS table does NOT automatically save!

✅ **Correct flow:**
1. Click "Add Task" button
2. Fill in task details
3. **Click "Save" button at top** (near "Last saved")

❌ **Common mistake:**
- Only clicking "Add Task" but not "Save"
- The task is in the UI but not saved to database yet

---

### Step 2: Open Browser Console (F12)

After clicking "Save", you should see:

```
💾 Saving planning data: {...}
✅ Planning data saved successfully at 10:30:45 AM
🔄 Syncing WBS tasks to database...
✅ WBS tasks synced: { created: 1, updated: 0, errors: [] }
📊 Created: 1, Updated: 0
```

**What each log means:**
- Line 1: Planning data being sent
- Line 2: JSON saved successfully
- Line 3: Sync API being called
- Line 4: Sync result
- Line 5: Count of tasks synced

---

### Step 3: Check for Errors

**If you see these instead:**

#### Error 1: No sync logs at all
```
💾 Saving planning data: {...}
✅ Planning data saved successfully
(nothing else)
```
**Problem:** Sync not being called
**Solution:** Refresh page and try again

#### Error 2: Sync failed
```
⚠️ WBS sync failed, but planning data was saved
```
**Problem:** Sync API error
**Solution:** Check Step 4 below

#### Error 3: Task has no title
```
✅ WBS tasks synced: { created: 0, updated: 0, errors: [] }
📊 Created: 0, Updated: 0
```
**Problem:** Task skipped because no title parts
**Solution:** Fill in Milestone, Task, OR Subtask field

---

### Step 4: Verify Task Has Required Fields

For a task to sync, it needs:

**Required (at least ONE):**
- ✅ Milestone name
- ✅ Task name
- ✅ Subtask name

**Optional but recommended:**
- Start date (needed for Gantt chart)
- End date (needed for Gantt chart)
- Assigned to (needed to show in My Tasks)
- Status

**Example GOOD task:**
| Milestone | Task | Start | End | Assigned | Status |
|-----------|------|-------|-----|----------|--------|
| Phase 1 | Design | 2025-01-15 | 2025-01-30 | John | In Progress |

**Example BAD task (will be skipped):**
| Milestone | Task | Start | End | Assigned | Status |
|-----------|------|-------|-----|----------|--------|
| | | | | | |

---

### Step 5: Manual Sync Test

If auto-sync isn't working, try manual API call:

**Option A: Using Browser Console**
```javascript
// Open console (F12), paste and run:
fetch(`/api/projects/${projectId}/sync-wbs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(console.log)

// Replace projectId with your actual project ID
```

**Option B: Check API directly**
1. Find your project ID (in URL: `/projects/[ID]`)
2. Go to: `http://localhost:3000/api/projects/[ID]/sync-wbs`
3. Should see JSON response

---

### Step 6: Check Database

**Using Prisma Studio:**
```bash
npx prisma studio
```

1. Open `Task` table
2. Filter by `sourceType: 'WBS'`
3. Check if your task exists
4. Look at `sourceId` - should match WBS task ID

---

### Step 7: Verify My Tasks Query

**Check if issue is with My Tasks page:**

1. Go to Roadmap page
2. Find your project
3. Click ▶ to expand
4. Do you see the task in Gantt chart?

**If YES in Gantt, NO in My Tasks:**
- Task exists in database
- Issue is with My Tasks filtering
- Check if task is assigned to YOU

**If NO in both:**
- Task didn't sync
- Go back to Step 1

---

## Common Issues & Solutions

### Issue 1: "Created: 0, Updated: 0"

**Cause:** Task has no title (all fields empty)

**Solution:**
```
❌ Milestone: [empty]
   Task: [empty]
   Subtask: [empty]

✅ Milestone: "Phase 1"    (or)
✅ Task: "Design"          (or)
✅ Subtask: "Wireframes"
```

### Issue 2: Task in Gantt but not My Tasks

**Cause:** Task not assigned to you

**Solution:**
1. Go back to WBS
2. Set "Assigned to" = Your name
3. Click Save
4. Check console: Should see "Updated: 1"

### Issue 3: No console logs at all

**Cause:** JavaScript error preventing sync

**Solution:**
1. Check console for RED errors
2. Screenshot and share the error
3. Might be browser cache - try hard refresh (Ctrl+Shift+R)

### Issue 4: "500 Internal Server Error"

**Cause:** Server-side error in sync API

**Solution:**
1. Check terminal where `npm run dev` is running
2. Look for error logs
3. Might be database connection issue
4. Try restarting dev server

---

## Debug Checklist

Before reporting issue, verify:

- [ ] Clicked "Save" button (not just "Add Task")
- [ ] Task has at least one title field filled
- [ ] Saw success logs in console
- [ ] Waited 1-2 seconds for sync
- [ ] Refreshed My Tasks page
- [ ] Task is assigned to you
- [ ] Dev server is running
- [ ] No red errors in console
- [ ] Checked Gantt chart too

---

## What to Share for Help

If still not working, share:

1. **Console logs** (screenshot)
2. **Task details** (what you filled in)
3. **Terminal output** (where npm run dev is running)
4. **Network tab** (F12 → Network → filter "sync-wbs")

---

## Quick Test

**To verify system is working:**

1. Create a simple test task:
   - Milestone: "TEST"
   - Task: "Sync Test"
   - Start: Today
   - End: Tomorrow  
   - Assigned to: YOU
   - Status: "In Progress"

2. Click "Save"

3. Check console:
   ```
   ✅ WBS tasks synced: { created: 1, updated: 0, errors: [] }
   ```

4. Go to My Tasks

5. Should see: "TEST - Sync Test"

If this works, your original task might be missing required fields.

---

**Let me know what you see in the console after clicking Save!** 🔍

