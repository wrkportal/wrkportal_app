# 🗺️ Navigation Guide - Program & Project Hierarchy

## 🎯 COMPLETE NAVIGATION FLOW

### **Visual Navigation Map:**

```
┌──────────────────────────────────────────────────────────────┐
│                    🏠 HOMEPAGE (Dashboard)                    │
│                  /  (Overview of everything)                  │
└────────┬────────────────────────────────────────────┬────────┘
         │                                             │
         │                                             │
    ┌────▼────────┐                              ┌────▼─────────┐
    │  PROGRAMS   │                              │   PROJECTS   │
    │    LIST     │                              │     LIST     │
    │  /programs  │                              │  /projects   │
    └────┬────────┘                              └────┬─────────┘
         │                                             │
         │ Click program card                          │ Click project card
         │                                             │
    ┌────▼──────────────────┐                    ┌────▼──────────────────┐
    │   PROGRAM DETAIL      │                    │   PROJECT DETAIL      │
    │  /programs/[id] ✨NEW │                    │   /projects/[id]      │
    │                       │                    │                       │
    │ Shows:                │                    │ Shows:                │
    │ • All projects        ├───────────────────►│ • Tasks & board       │
    │ • Budget rollup       │ Click project card │ • Team members        │
    │ • Team summary        │                    │ • Timeline            │
    │ • Metrics             │                    │ • Budget              │
    └───────────────────────┘                    └───────┬───────────────┘
                                                          │
                                                          │ Click task
                                                          │
                                                     ┌────▼────────┐
                                                     │TASK DETAILS │
                                                     │(Modal/Page) │
                                                     └─────────────┘
```

---

## 🔄 USER JOURNEY EXAMPLES

### **Journey 1: Executive Oversight**

```
1. 🏠 Home → Click "Programs" in sidebar
   ↓
2. 📂 Programs List (/programs)
   See: All programs with status
   ↓
3. 🎯 Click: "Customer Portal Modernization"
   ↓
4. 📊 Program Detail (/programs/program-1) ✨NEW
   See:
   • 5 projects in this program
   • Overall progress: 68%
   • Budget: $2.1M of $3.5M spent
   • 12 team members
   • ⚠️ 2 projects at risk
   ↓
5. 🔍 Click: "Dashboard Redesign" project
   ↓
6. 📄 Project Detail (/projects/project-1)
   See: Tasks, timeline, detailed budget
```

---

### **Journey 2: Project Manager View**

```
1. 🏠 Home → Click "Projects" in sidebar
   ↓
2. 📋 Projects List (/projects)
   See: All projects across all programs
   ↓
3. 🔗 Filter: "In Program: Customer Portal"
   ↓
4. 🎯 Click: Any project card
   ↓
5. 📄 Project Detail
   See: Breadcrumb: "Customer Portal > Dashboard Redesign"
   Click: "Customer Portal" in breadcrumb
   ↓
6. 📊 Program Detail (/programs/program-1) ✨NEW
   See: Context of all related projects
```

---

### **Journey 3: Team Member Task View**

```
1. 🏠 Home → Click "My Work"
   ↓
2. ✅ My Tasks (/my-work)
   See: All tasks assigned to me
   ↓
3. 🎯 Click: Task "Design login page"
   ↓
4. 📄 Redirects to: Project Detail (/projects/project-1?tab=board)
   See: Task in context of project
   ↓
5. 🔼 Click: "Customer Portal Modernization" (program name)
   ↓
6. 📊 Program Detail (/programs/program-1) ✨NEW
   See: Full program context
```

---

## 🎨 VISUAL BREADCRUMB NAVIGATION

### **Where You Are (Breadcrumbs):**

#### **On Program Detail Page:**

```
Home > Programs > Customer Portal Modernization
                        ↑ You are here
```

#### **On Project Detail Page:**

```
Home > Programs > Customer Portal Modernization > Dashboard Redesign
                                                        ↑ You are here
```

#### **Future Enhancement - Clickable Breadcrumbs:**

```typescript
<nav className="breadcrumb">
  <Link href="/">Home</Link> >
  <Link href="/programs">Programs</Link> >
  <Link href="/programs/program-1">Customer Portal</Link> >
  <span>Dashboard Redesign</span>
</nav>
```

---

## 🖱️ CLICKABLE ELEMENTS

### **Programs List Page (/programs):**

| Element              | Action         | Destination            |
| -------------------- | -------------- | ---------------------- |
| Program Card         | Click anywhere | `/programs/[id]` ✨NEW |
| "New Program" button | Opens dialog   | Create form            |
| Program name         | Click          | `/programs/[id]` ✨NEW |
| Status badge         | Visual only    | -                      |

---

### **Program Detail Page (/programs/[id]) ✨NEW:**

| Element               | Action      | Destination        |
| --------------------- | ----------- | ------------------ |
| Back button (←)       | Click       | `/programs` (list) |
| "Add Project" button  | Click       | `/projects/new`    |
| Project card          | Click card  | `/projects/[id]`   |
| "View Details" button | Click       | `/projects/[id]`   |
| Budget items          | Visual only | -                  |

---

### **Projects List Page (/projects):**

| Element              | Action        | Destination      |
| -------------------- | ------------- | ---------------- |
| Project card         | Click         | `/projects/[id]` |
| "New Project" button | Opens dialog  | Create form      |
| Program name badge   | Future: Click | `/programs/[id]` |
| Status badge         | Visual only   | -                |

---

## 📍 ALL CURRENT ROUTES

### **✅ Working Routes:**

```
/                          → Homepage/Dashboard
/login                     → Login page
/programs                  → Programs list
/programs/[id]             → Program detail ✨NEW
/programs/new              → Create program (via dialog)
/projects                  → Projects list
/projects/[id]             → Project detail
/projects/new              → Create project
/my-work                   → My tasks
/timesheets                → Timesheet management
/okrs                      → Goals & OKRs
/resources                 → Resource allocation
/roadmap                   → Strategic roadmap
/changes                   → Change control
/raid                      → Risks & issues
/financials                → Financial tracking
/reports                   → Reporting
/admin                     → Admin settings
```

---

## 🔗 RELATIONSHIP CONNECTIONS

### **How Data Links Together:**

```typescript
// PROGRAM has many PROJECTS
program.id === project.programId

// Example:
{
  id: "program-1",
  name: "Customer Portal Modernization",
  // ... other fields
}

// PROJECTS link to PROGRAM
{
  id: "project-1",
  programId: "program-1",  // ← Links to program above
  name: "Dashboard Redesign",
  // ... other fields
}

{
  id: "project-2",
  programId: "program-1",  // ← Same program
  name: "API Gateway",
  // ... other fields
}
```

---

## 🎯 QUICK REFERENCE

### **To View Program Details:**

**Option 1:** Click from Programs List

```
/programs → Click any card → /programs/[id]
```

**Option 2:** Direct URL

```
Navigate to: /programs/program-1
```

**Option 3:** From Project (Future)

```
/projects/[id] → Click program breadcrumb → /programs/[id]
```

---

### **What You See on Program Detail:**

1. **Header:**

   - Back button
   - Program name & status
   - "Add Project" button

2. **Metrics (4 cards):**

   - Total projects count
   - Overall progress %
   - Budget utilization
   - Team member count

3. **Program Info:**

   - Owner name
   - Start/End dates
   - RAG status
   - Risk alerts

4. **Projects List:**

   - All projects in program
   - Each project card clickable
   - Shows: name, code, status, progress, budget, tasks

5. **Budget Breakdown:**
   - Program budget
   - Each project budget
   - Total spent summary

---

## 🎨 UI STATES

### **Loading State:**

```typescript
if (!program) {
  return (
    <div>Program Not Found</div>
    <Button>← Back to Programs</Button>
  )
}
```

### **Empty State:**

```typescript
if (programProjects.length === 0) {
  return (
    <div>No Projects Yet</div>
    <Button>Add First Project</Button>
  )
}
```

### **Loaded State:**

```typescript
// Shows all metrics, projects, and budget breakdown
```

---

## 🔮 FUTURE NAVIGATION ENHANCEMENTS

### **Could Add:**

1. **Breadcrumb Component:**

```typescript
<Breadcrumb>
  <BreadcrumbItem href='/'>Home</BreadcrumbItem>
  <BreadcrumbItem href='/programs'>Programs</BreadcrumbItem>
  <BreadcrumbItem>Customer Portal</BreadcrumbItem>
</Breadcrumb>
```

2. **Quick Jump Menu:**

```typescript
<Select>
  <SelectItem>Jump to Project 1</SelectItem>
  <SelectItem>Jump to Project 2</SelectItem>
</Select>
```

3. **Sidebar Context:**

```typescript
// Highlight current program in sidebar
// Show related items
```

4. **Recent Items:**

```typescript
// "Recently Viewed Programs"
// Quick access to last 5 programs
```

---

## 📱 MOBILE NAVIGATION

### **Mobile Menu:**

```
☰ Menu
  ├─ Home
  ├─ Programs ✓ (You are here)
  ├─ Projects
  ├─ My Work
  └─ ...
```

### **Mobile Back Navigation:**

```
← Programs              [Mobile view uses full back button]
Customer Portal Modernization
```

---

## ✅ TESTING THE NAVIGATION

### **Test Checklist:**

- [ ] Navigate to /programs
- [ ] Click a program card
- [ ] Verify metrics load correctly
- [ ] Click a project card within program
- [ ] Verify navigation to project detail
- [ ] Click back button
- [ ] Verify return to programs list
- [ ] Test "Add Project" button
- [ ] Test responsive design
- [ ] Test dark mode
- [ ] Test browser back button

---

## 🎊 SUMMARY

### **What's Connected:**

```
Programs ←→ Program Detail ←→ Projects ←→ Tasks
   ↓            ↓                ↓          ↓
  List      Deep Dive        Execution  Granular
```

### **Navigation is:**

✅ **Intuitive** - Click cards to drill down
✅ **Fast** - Instant client-side routing
✅ **Contextual** - Always know where you are
✅ **Hierarchical** - Clear parent-child relationships
✅ **Responsive** - Works on all devices
✅ **Accessible** - Keyboard navigation support

---

**Your app now has complete hierarchical navigation! 🎉**

Users can seamlessly navigate through:

- Programs → Program Details → Projects → Tasks

With clear visual indicators and intuitive interactions at every level! 🚀
