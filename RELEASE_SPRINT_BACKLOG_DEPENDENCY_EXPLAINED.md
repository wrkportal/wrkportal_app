# Release, Sprint, Backlog, and Dependencies - Explained

## 📋 Overview

This document explains the differences between **Releases**, **Sprints**, **Backlog**, and **Dependencies**, and how they should be captured in the system.

---

## 🔄 **What They Are & Differences**

### 1. **RELEASE** 🚀
**Definition:** A planned deployment of features, fixes, or updates to production/end-users.

**Characteristics:**
- **Time-bound:** Has a target release date
- **Version-based:** Usually has a version number (e.g., v2.1.0)
- **Production-focused:** What gets shipped to customers
- **Contains:** Multiple features, bug fixes, improvements
- **Status:** PLANNED → IN_PROGRESS → RELEASED → CANCELLED

**Example:**
- "Q1 2024 Release v2.1.0" - Contains 12 features, 3 bug fixes
- Release Date: March 15, 2024
- Associated with: Multiple projects/features

**Key Fields:**
- Name, Version, Description
- Release Date, Target Date
- Status, Progress
- Linked Projects/Features
- Features count, Bugs count

---

### 2. **SPRINT** 🏃
**Definition:** A time-boxed iteration (usually 1-4 weeks) where a team works on a set of tasks to deliver a specific goal.

**Characteristics:**
- **Time-boxed:** Fixed duration (typically 2 weeks)
- **Goal-oriented:** Has a sprint goal
- **Agile methodology:** Core to Scrum/Kanban
- **Contains:** Multiple tasks/stories
- **Status:** PLANNED → ACTIVE → COMPLETED → CANCELLED

**Example:**
- "Sprint 1 - Q2 2024"
- Goal: "Implement core authentication features"
- Duration: April 1-14, 2024
- Contains: 24 tasks, 42 story points

**Key Fields:**
- Name, Goal, Description
- Start Date, End Date
- Status, Progress
- Story Points, Velocity
- Total Tasks, Completed Tasks
- Linked Project

---

### 3. **BACKLOG** 📝
**Definition:** A prioritized list of work items (tasks, features, bugs) that need to be done but haven't been started yet.

**Characteristics:**
- **Prioritized:** Items ordered by priority/importance
- **Unassigned work:** Not yet in a sprint/release
- **Dynamic:** Items added/removed frequently
- **Source of work:** Where sprints pull tasks from
- **Status:** Items are typically TODO or unassigned

**Example:**
- "Implement user authentication" - HIGH priority, 8 story points
- "Design new dashboard UI" - MEDIUM priority, 5 story points
- "Fix login bug" - CRITICAL priority, 2 story points

**Key Fields:**
- Title, Description
- Priority (LOW, MEDIUM, HIGH, CRITICAL)
- Status (TODO, IN_PROGRESS, etc.)
- Story Points, Estimated Hours
- Due Date
- Linked Project, Assignee
- Sprint (if assigned)

**Note:** Backlog items are essentially **Tasks** that haven't been assigned to a sprint yet.

---

### 4. **DEPENDENCY** 🔗
**Definition:** A relationship between two work items where one item cannot proceed until another is completed.

**Characteristics:**
- **Relationship-based:** Links two items (tasks, projects, features, releases)
- **Directional:** One item depends on another
- **Blocking:** Can prevent progress
- **Types:** BLOCKS, BLOCKED_BY, DEPENDS_ON, RELATED_TO
- **Status:** ACTIVE → RESOLVED → AT_RISK → BLOCKED

**Example:**
- "User Management Feature" **DEPENDS_ON** "Authentication System"
- "Mobile App Release" **BLOCKED_BY** "API v2.0 Completion"
- "Feature A" **BLOCKS** "Feature B"

**Key Fields:**
- Name, Description
- Type (BLOCKS, BLOCKED_BY, DEPENDS_ON, RELATED_TO)
- Status, Priority
- Source Item (what depends)
- Target Item (what it depends on)
- Impact, Mitigation
- Created At, Resolved At

---

## 🔄 **How They Relate to Each Other**

```
PROJECT
  ├── RELEASES (multiple releases per project)
  │     └── Features/Tasks
  │
  ├── SPRINTS (multiple sprints per project)
  │     └── Tasks (pulled from backlog)
  │
  ├── BACKLOG (unassigned tasks)
  │     └── Tasks (prioritized, not in sprint)
  │
  └── DEPENDENCIES (relationships)
        ├── Task → Task
        ├── Task → Feature
        ├── Feature → Release
        └── Project → Project
```

**Flow:**
1. **Backlog** contains all unassigned tasks
2. **Sprint** pulls tasks from backlog
3. **Release** contains features/tasks from multiple sprints
4. **Dependencies** track relationships between any items

---

## 💾 **How to Capture in Database**

### **Current Status:**
❌ **No database models exist** for Release, Sprint, or Dependency
✅ **Backlog** can use existing `Task` model (tasks with status TODO and no sprint assignment)

### **Recommended Database Schema:**

#### **1. Release Model**
```prisma
model Release {
  id          String        @id @default(cuid())
  tenantId    String
  projectId   String?      // Optional - can span multiple projects
  name        String
  version     String
  description String?
  status      ReleaseStatus @default(PLANNED)
  releaseDate DateTime?
  targetDate  DateTime
  progress    Int          @default(0)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  project     Project?     @relation(fields: [projectId], references: [id])
  tasks       Task[]       // Tasks included in this release
  features    ReleaseFeature[]
  
  @@index([tenantId])
  @@index([projectId])
  @@index([status])
}

enum ReleaseStatus {
  PLANNED
  IN_PROGRESS
  RELEASED
  CANCELLED
}
```

#### **2. Sprint Model**
```prisma
model Sprint {
  id          String      @id @default(cuid())
  tenantId    String
  projectId   String
  name        String
  goal        String
  description String?
  status      SprintStatus @default(PLANNED)
  startDate   DateTime
  endDate     DateTime
  progress    Int         @default(0)
  storyPoints Int         @default(0)
  velocity    Int?        // Calculated after completion
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  project     Project     @relation(fields: [projectId], references: [id])
  tasks       Task[]      // Tasks in this sprint
  
  @@index([tenantId])
  @@index([projectId])
  @@index([status])
}

enum SprintStatus {
  PLANNED
  ACTIVE
  COMPLETED
  CANCELLED
}
```

#### **3. Dependency Model**
```prisma
model Dependency {
  id          String           @id @default(cuid())
  tenantId    String
  name        String
  description String?
  type        DependencyType
  status      DependencyStatus @default(ACTIVE)
  priority    Priority         @default(MEDIUM)
  impact      String
  mitigation  String?
  sourceType  String           // 'PROJECT', 'TASK', 'FEATURE', 'RELEASE'
  sourceId    String
  targetType  String           // 'PROJECT', 'TASK', 'FEATURE', 'RELEASE'
  targetId    String
  resolvedAt  DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  
  tenant      Tenant           @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
  @@index([sourceType, sourceId])
  @@index([targetType, targetId])
  @@index([status])
}

enum DependencyType {
  BLOCKS
  BLOCKED_BY
  DEPENDS_ON
  RELATED_TO
}

enum DependencyStatus {
  ACTIVE
  RESOLVED
  AT_RISK
  BLOCKED
}
```

#### **4. Backlog (Uses Existing Task Model)**
```prisma
// Backlog items are Tasks with:
// - status: TODO (or IN_PROGRESS)
// - sprintId: null (not assigned to sprint)
// - Can be filtered by project, priority, etc.
```

**Update Task Model:**
```prisma
model Task {
  // ... existing fields ...
  sprintId    String?  // Add this field
  releaseId   String?  // Add this field
  sprint      Sprint?   @relation(fields: [sprintId], references: [id])
  release     Release?  @relation(fields: [releaseId], references: [id])
  
  // ... rest of fields ...
}
```

---

## 🔧 **How Product-Management Page Will Capture Data**

### **Current Implementation:**
The product-management page currently:
- ✅ Fetches **Projects** from `/api/projects`
- ✅ Fetches **Tasks** from `/api/tasks`
- ✅ Fetches **Goals** from `/api/goals`
- ❌ **Releases, Sprints, Dependencies** - Currently showing "0" or placeholder data

### **After Database Models Are Created:**

1. **Stats Widget:**
   - "Upcoming Releases" → Count from `Release` table where `status = PLANNED` or `IN_PROGRESS`
   - "Delayed Tasks" → Already calculated from `Task` table
   - "Blocked Tasks" → Already calculated from `Task` table where `status = BLOCKED`

2. **Roadmap Widget:**
   - Currently shows projects
   - Could also show upcoming releases with their target dates

3. **Blockers Widget:**
   - Currently shows blocked tasks
   - Could also show dependencies with status `BLOCKED` or `AT_RISK`

4. **Metrics Widget:**
   - Could add "Sprint Velocity" from completed sprints
   - Could add "Release Success Rate" from released vs planned releases

---

## 📊 **Data Flow Example**

```
1. Product Manager creates a PROJECT
   ↓
2. Tasks are added to BACKLOG (Task with sprintId = null)
   ↓
3. Sprint Planning: Tasks moved from BACKLOG to SPRINT
   ↓
4. Sprint Execution: Tasks worked on during sprint
   ↓
5. Sprint Completion: Tasks marked DONE, velocity calculated
   ↓
6. Release Planning: Completed features/tasks added to RELEASE
   ↓
7. Release Deployment: Release marked RELEASED
```

**Dependencies can be created at any point:**
- Task A depends on Task B
- Feature depends on Release
- Project depends on another Project

---

## 🚀 **Next Steps to Implement**

1. **Create Database Models:**
   - Add `Release`, `Sprint`, `Dependency` models to `schema.prisma`
   - Add `sprintId` and `releaseId` to `Task` model
   - Run migration: `npx prisma migrate dev`

2. **Create API Routes:**
   - `/api/releases` - GET (list), POST (create)
   - `/api/releases/[id]` - GET, PUT, DELETE
   - `/api/sprints` - GET (list), POST (create)
   - `/api/sprints/[id]` - GET, PUT, DELETE
   - `/api/dependencies` - GET (list), POST (create)
   - `/api/dependencies/[id]` - GET, PUT, DELETE

3. **Update Pages:**
   - Replace mock data in `app/releases/page.tsx`
   - Replace mock data in `app/sprints/page.tsx`
   - Replace mock data in `app/dependencies/page.tsx`
   - Update `app/backlog/page.tsx` to filter tasks without sprint assignment

4. **Update Product-Management Page:**
   - Fetch releases from `/api/releases`
   - Fetch sprints from `/api/sprints`
   - Fetch dependencies from `/api/dependencies`
   - Update stats/metrics calculations

---

## 📝 **Summary**

| Concept | Purpose | Time-bound | Contains | Status |
|---------|---------|------------|----------|--------|
| **Release** | Ship to customers | Yes (release date) | Features, fixes | PLANNED → RELEASED |
| **Sprint** | Time-boxed work | Yes (1-4 weeks) | Tasks | PLANNED → COMPLETED |
| **Backlog** | Unassigned work | No | Tasks (prioritized) | TODO items |
| **Dependency** | Relationships | No | Links between items | ACTIVE → RESOLVED |

**Key Takeaway:**
- **Backlog** = Tasks not in a sprint
- **Sprint** = Time-boxed container for tasks
- **Release** = Customer-facing deployment
- **Dependency** = Relationship tracker

All four work together to manage the product development lifecycle! 🎯

