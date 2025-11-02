# 📊 Program & Project Hierarchy

## 🏗️ THE COMPLETE HIERARCHY

```
┌──────────────────────────────────────────────┐
│            PORTFOLIO                         │
│  (Strategic grouping of programs)            │
│  • Multi-year strategic vision               │
│  • Budget: Aggregate of all programs         │
│  • Example: "Digital Transformation"         │
└─────────────┬────────────────────────────────┘
              │
              │ Contains multiple Programs
              ↓
┌──────────────────────────────────────────────┐
│            PROGRAM                           │
│  (Collection of related projects)            │
│  • Strategic initiative (6-18 months)        │
│  • Shared objectives & resources             │
│  • Example: "Customer Portal Modernization" │
└─────────────┬────────────────────────────────┘
              │
              │ Contains multiple Projects
              ↓
┌──────────────────────────────────────────────┐
│            PROJECT                           │
│  (Specific deliverable work)                 │
│  • Fixed scope, timeline, budget             │
│  • Tactical execution (3-12 months)          │
│  • Example: "Customer Dashboard Redesign"   │
└─────────────┬────────────────────────────────┘
              │
              │ Contains multiple Tasks
              ↓
┌──────────────────────────────────────────────┐
│            TASK                              │
│  (Granular work items)                       │
│  • Day-to-day activities                     │
│  • Assigned to individuals                   │
│  • Example: "Design login page"              │
└──────────────────────────────────────────────┘
```

---

## 🔗 HOW THEY'RE CONNECTED

### 1️⃣ **Data Structure Connection**

Looking at the **TypeScript types**:

```typescript
// Program interface
export interface Program {
  id: string
  portfolioId?: string // ← Links to parent Portfolio
  name: string
  description?: string
  projects: Project[] // ← Contains child Projects
  budget: Budget
  // ... other fields
}

// Project interface
export interface Project {
  id: string
  programId?: string // ← Links to parent Program
  name: string
  code: string
  status: ProjectStatus
  budget: Budget
  // ... other fields
}

// Task interface
export interface Task {
  id: string
  projectId: string // ← Links to parent Project
  title: string
  status: TaskStatus
  assigneeId?: string
  // ... other fields
}
```

---

### 2️⃣ **Real-World Example from Mock Data**

```javascript
// PORTFOLIO
Portfolio: "Digital Transformation"
  └─ portfolioId: "portfolio-1"

// PROGRAM (belongs to Portfolio)
Program: "Customer Portal Modernization"
  ├─ id: "program-1"
  ├─ portfolioId: "portfolio-1"    // ← Connected to Portfolio
  └─ Projects: [ ... ]

// PROJECTS (belong to Program)
Project 1: "Customer Dashboard Redesign"
  ├─ id: "project-1"
  ├─ programId: "program-1"        // ← Connected to Program
  ├─ code: "CDR-001"
  └─ Tasks: [ ... ]

Project 2: "API Gateway Implementation"
  ├─ id: "project-2"
  ├─ programId: "program-1"        // ← Connected to same Program
  ├─ code: "AGI-002"
  └─ Tasks: [ ... ]

// TASKS (belong to Projects)
Task: "Design new dashboard layout"
  ├─ id: "task-1"
  └─ projectId: "project-1"        // ← Connected to Project
```

---

## 🎯 WHY THIS STRUCTURE?

### **Portfolio Level:**

- **Purpose**: Strategic alignment
- **Timeframe**: Multi-year (3-5 years)
- **Focus**: Business outcomes
- **Example**: "Digital Transformation Initiative"
- **Managed by**: Executives, PMO Lead

### **Program Level:**

- **Purpose**: Coordinated execution
- **Timeframe**: 6-18 months
- **Focus**: Related deliverables
- **Example**: "Customer Portal Modernization"
- **Managed by**: Program Manager

### **Project Level:**

- **Purpose**: Specific deliverable
- **Timeframe**: 3-12 months
- **Focus**: Tangible output
- **Example**: "Dashboard Redesign"
- **Managed by**: Project Manager

### **Task Level:**

- **Purpose**: Granular work
- **Timeframe**: Hours to weeks
- **Focus**: Individual activities
- **Example**: "Design login page"
- **Managed by**: Team Members

---

## 📊 BENEFITS OF THIS HIERARCHY

### 1. **Budget Roll-up**

```
Portfolio Budget: $5,000,000
  └─ Program Budget: $1,500,000
      ├─ Project 1: $800,000
      ├─ Project 2: $400,000
      └─ Project 3: $300,000
```

### 2. **Status Aggregation**

- If any project is RED → Program shows RED
- If all projects are GREEN → Program shows GREEN
- Portfolio status = Aggregate of all programs

### 3. **Resource Planning**

- View resources across all projects in a program
- Avoid double-booking team members
- Balance workload across related initiatives

### 4. **Risk Management**

- Risks bubble up from Tasks → Projects → Programs → Portfolios
- Cross-project dependencies visible at Program level

### 5. **Reporting**

- **Executives** see Portfolio dashboard
- **PMO** sees Program rollups
- **Project Managers** see Project details
- **Team Members** see Tasks

---

## 🔄 REAL BUSINESS SCENARIOS

### Scenario 1: New Program Creation

```
1. Executive creates Portfolio: "Cloud Migration"
2. PMO creates Program: "Infrastructure Migration Phase 1"
   └─ Links to Portfolio
3. PM creates Projects:
   ├─ "Database Migration"
   ├─ "Application Migration"
   └─ "Network Setup"
   └─ All linked to Program
4. Team creates Tasks under each Project
```

### Scenario 2: Budget Tracking

```
Portfolio: $10M approved
  └─ Program 1: $3M allocated
      ├─ Project A: $1.2M spent
      ├─ Project B: $800K spent
      └─ Project C: $1M remaining
```

### Scenario 3: Status Reporting

```
Project "Dashboard Redesign" status changes to AT_RISK
  ↓
Program "Portal Modernization" automatically flags as AMBER
  ↓
Portfolio "Digital Transformation" shows risk indicator
  ↓
Executive dashboard highlights the concern
```

---

## 💡 OPTIONAL vs REQUIRED RELATIONSHIPS

### **Project → Program (OPTIONAL)**

```typescript
programId?: string  // Optional - Projects can exist standalone
```

**When Optional:**

- Small tactical projects
- Maintenance work
- Proof of concepts

**When Required:**

- Large strategic initiatives
- Cross-functional work
- Multi-year efforts

### **Program → Portfolio (OPTIONAL)**

```typescript
portfolioId?: string  // Optional - Programs can exist standalone
```

**When Optional:**

- Departmental programs
- Single-purpose initiatives

**When Required:**

- Enterprise-wide programs
- Strategic transformations

---

## 🔍 HOW IT WORKS IN THE APP

### **Programs Page** (`app/programs/page.tsx`)

```typescript
// Display all programs
mockPrograms.map((program) => {
  // Shows:
  // - Program name
  // - Owner
  // - Budget
  // - Status (aggregated from projects)
  // - Number of projects
})
```

### **Projects Page** (`app/projects/page.tsx`)

```typescript
// Display projects with program context
mockProjects.map((project) => {
  const program = mockPrograms.find((p) => p.id === project.programId)
  // Shows:
  // - Project name and code
  // - Parent program name
  // - Budget, status, progress
  // - Team members
})
```

### **Creating New Entities**

**ProgramDialog:**

```typescript
<Select name='portfolioId'>
  {mockPortfolios.map((portfolio) => (
    <SelectItem value={portfolio.id}>{portfolio.name}</SelectItem>
  ))}
</Select>
```

**TaskDialog:**

```typescript
<Select name='projectId'>
  {mockProjects.map((project) => (
    <SelectItem value={project.id}>
      {project.name} ({project.code})
    </SelectItem>
  ))}
</Select>
```

---

## 📈 DATABASE RELATIONSHIPS (Future Backend)

When you add a backend, the relationships will work like:

```sql
-- Programs table
CREATE TABLE programs (
  id UUID PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id),  -- Foreign key
  name VARCHAR(255),
  ...
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id),      -- Foreign key
  name VARCHAR(255),
  ...
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),  -- Foreign key (required)
  title VARCHAR(255),
  ...
);
```

### **Cascade Behavior:**

- Delete Program → Option to reassign or delete all Projects
- Delete Project → Tasks either deleted or orphaned
- Archive Program → All Projects also archived

---

## 🎯 NAVIGATION FLOW IN THE APP

```
1. User clicks "Programs" in sidebar
   ↓
2. Sees list of all programs
   ↓
3. Clicks on a program (e.g., "Customer Portal Modernization")
   ↓
4. Program detail page shows:
   - All projects in this program
   - Combined budget and status
   - Shared resources
   ↓
5. Clicks on a project within the program
   ↓
6. Project detail page shows:
   - All tasks in this project
   - Project-specific details
   - Parent program context
```

---

## 🔄 CURRENT STATE IN YOUR APP

### ✅ What's Already Built:

- **Type definitions** with proper relationships
- **Mock data** showing hierarchy
- **Programs page** displaying all programs
- **Projects page** displaying all projects with program links
- **Dialog forms** to create new programs/projects

### 🔜 What Could Be Enhanced:

- **Visual hierarchy breadcrumbs**: `Portfolio > Program > Project`
- **Program detail page**: Show all projects within a program
- **Budget rollup visualizations**: See spending across hierarchy
- **Gantt charts**: Cross-project timelines within programs
- **Resource heat maps**: Allocation across program projects

---

## 📝 SUMMARY

### **Hierarchy:**

Portfolio → Program → Project → Task

### **Key Relationships:**

- **Program.portfolioId** → Links to Portfolio (optional)
- **Project.programId** → Links to Program (optional)
- **Task.projectId** → Links to Project (required)

### **Benefits:**

- ✅ Budget tracking across levels
- ✅ Status aggregation upwards
- ✅ Resource visibility
- ✅ Risk management
- ✅ Executive reporting

### **Flexibility:**

- Projects can exist without Programs (standalone)
- Programs can exist without Portfolios (departmental)
- But Tasks MUST belong to a Project

---

**Your system is already structured correctly! The hierarchy is in place and ready to use.** 🎉
