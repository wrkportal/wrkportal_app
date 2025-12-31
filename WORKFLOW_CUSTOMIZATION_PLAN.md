# 🎯 Workflow-Based Customization Plan

## Overview

This plan outlines how to customize wrkportal.com based on different industry workflows, allowing users to select their primary workflow and have the entire system adapt with industry-standard terminology, widgets, metrics, and processes.

---

## 🎯 Goals

1. **User Workflow Selection**: Allow users to choose their primary workflow during onboarding or in settings
2. **Multi-Workflow Support**: Users can work across multiple workflows (e.g., Software Dev + Sales) without conflicts
3. **Context-Aware Terminology**: Terminology adapts based on current project/page context, preventing conflicts
4. **Project-Level Workflow**: Each project can have its own workflow type, allowing mixed workflows in one organization
5. **Workflow-Specific Landing Pages**: Each workflow has its own optimized landing page with relevant views and features
6. **Workflow-Specific Tasks & Requirements**: Tasks and requirements templates tailored to each workflow
7. **Methodology-Based Workflows**: Support for Agile, Scrum, Kanban, Waterfall, Lean, etc. within each industry workflow
8. **Terminology Mapping**: Replace generic terms with industry-specific terminology throughout the UI
9. **Workflow-Specific Widgets**: Show relevant widgets/metrics for each workflow
10. **Industry-Standard Processes**: Implement workflow-specific statuses, fields, and processes
11. **Backward Compatible**: Zero breaking changes to existing functionality
12. **Flexible Architecture**: Make it easy to add new workflows in the future

---

## 📋 Supported Workflows

### 1. **Software Development**

- **Terminology**: Projects → Products/Features, Tasks → User Stories/Bugs, Issues → Bugs/Defects
- **Statuses**: Backlog, Sprint Planning, In Development, Code Review, Testing, Deployed
- **Metrics**: Sprint Velocity, Burndown, Code Coverage, Bug Resolution Time, Deployment Frequency
- **Widgets**: Sprint Board, Release Calendar, Bug Tracker, Code Quality Metrics, Deployment Pipeline

### 2. **Product Management**

- **Terminology**: Projects → Products/Initiatives, Tasks → Features/Epics, Issues → Blockers
- **Statuses**: Discovery, Planning, Development, Beta, Launch, Iteration
- **Metrics**: Feature Adoption, User Engagement, NPS, Roadmap Progress, Market Fit Score
- **Widgets**: Product Roadmap, Feature Requests, User Feedback, Analytics Dashboard, Release Planning

### 3. **Marketing**

- **Terminology**: Projects → Campaigns, Tasks → Marketing Activities, Issues → Campaign Issues
- **Statuses**: Planning, Active, Paused, Completed, Archived
- **Metrics**: ROI, Conversion Rate, Lead Generation, Campaign Performance, Budget Utilization
- **Widgets**: Campaign Performance, Lead Funnel, Budget Tracker, Social Media Metrics, Content Calendar

### 4. **Human Resources**

- **Terminology**: Projects → Initiatives/Programs, Tasks → HR Activities, Issues → HR Concerns
- **Statuses**: Planning, Active, On Hold, Completed
- **Metrics**: Time to Hire, Employee Satisfaction, Training Completion, Retention Rate, Recruitment Metrics
- **Widgets**: Recruitment Pipeline, Training Progress, Employee Engagement, Performance Reviews, Benefits Administration

### 5. **Legal**

- **Terminology**: Projects → Cases/Matters, Tasks → Legal Tasks, Issues → Legal Issues
- **Statuses**: Intake, Investigation, Active, Settlement, Closed
- **Metrics**: Case Resolution Time, Billable Hours, Win Rate, Compliance Score
- **Widgets**: Case Pipeline, Document Management, Billing Tracker, Compliance Calendar, Contract Management

### 6. **Customer Service**

- **Terminology**: Projects → Support Cases, Tasks → Tickets, Issues → Escalations
- **Statuses**: New, Open, In Progress, Waiting, Resolved, Closed
- **Metrics**: First Response Time, Resolution Time, Customer Satisfaction (CSAT), Ticket Volume, SLA Compliance
- **Widgets**: Ticket Queue, SLA Tracker, Customer Satisfaction, Agent Performance, Knowledge Base

### 7. **Operations**

- **Terminology**: Projects → Operations Projects, Tasks → Operational Tasks, Issues → Operational Issues
- **Statuses**: Planning, Active, Monitoring, Completed
- **Metrics**: Efficiency Metrics, Cost Reduction, Process Improvement, SLA Compliance
- **Widgets**: Process Dashboard, Resource Utilization, Cost Tracking, Performance Metrics

### 8. **IT Support**

- **Terminology**: Projects → IT Projects, Tasks → IT Tickets, Issues → Incidents
- **Statuses**: New, Assigned, In Progress, Resolved, Closed
- **Metrics**: Mean Time to Resolution (MTTR), Ticket Volume, System Uptime, First Call Resolution
- **Widgets**: Incident Dashboard, System Health, Asset Management, Change Management, Service Catalog

### 9. **Finance**

- **Terminology**: Projects → Financial Projects, Tasks → Financial Tasks, Issues → Financial Issues
- **Statuses**: Planning, Active, Review, Approved, Closed
- **Metrics**: Budget Variance, ROI, Cost Savings, Financial Performance, Forecast Accuracy
- **Widgets**: Budget Dashboard, Financial Reports, Expense Tracking, Revenue Analysis, Forecast Charts

### 10. **Sales**

- **Terminology**: Projects → Deals/Opportunities, Tasks → Sales Activities, Issues → Sales Blockers
- **Statuses**: Lead, Qualified, Proposal, Negotiation, Won, Lost
- **Metrics**: Sales Pipeline, Conversion Rate, Average Deal Size, Sales Velocity, Win Rate
- **Widgets**: Sales Pipeline, Revenue Forecast, Activity Tracker, Customer Relationship, Sales Performance

### 11. **General/Default**

- **Terminology**: Projects, Tasks, Issues (current default)
- **Statuses**: Planned, In Progress, On Hold, Completed, Cancelled
- **Metrics**: Standard project metrics
- **Widgets**: Standard project dashboard widgets

---

## 🔄 Methodology-Based Workflows

Each industry workflow can be further customized with different methodologies:

### **Methodology Types:**

1. **Agile**

   - **Features**: Sprints, User Stories, Backlog, Daily Standups, Retrospectives
   - **Views**: Sprint Board, Backlog View, Burndown Charts
   - **Tasks**: User Stories with Acceptance Criteria, Story Points, Epics
   - **Statuses**: Backlog, To Do, In Progress, In Review, Done

2. **Scrum**

   - **Features**: Sprints (2-4 weeks), Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective
   - **Views**: Sprint Board, Product Backlog, Sprint Burndown
   - **Tasks**: User Stories, Tasks, Bugs
   - **Roles**: Product Owner, Scrum Master, Development Team
   - **Artifacts**: Product Backlog, Sprint Backlog, Increment

3. **Kanban**

   - **Features**: Continuous Flow, WIP Limits, Visual Board, Lead Time Tracking
   - **Views**: Kanban Board, Cumulative Flow Diagram, Lead Time Chart
   - **Tasks**: Cards with WIP limits per column
   - **Statuses**: Custom columns (e.g., To Do, In Progress, Review, Done)

4. **Waterfall**

   - **Features**: Sequential Phases, Milestones, Gantt Charts, Requirements Documentation
   - **Views**: Gantt Chart, Phase View, Milestone Tracker
   - **Tasks**: Requirements, Design Tasks, Development Tasks, Testing Tasks
   - **Phases**: Requirements, Design, Implementation, Testing, Deployment, Maintenance

5. **Lean**

   - **Features**: Value Stream Mapping, Waste Elimination, Continuous Improvement
   - **Views**: Value Stream Map, Waste Tracker, Improvement Board
   - **Tasks**: Value-adding tasks, Waste elimination tasks
   - **Metrics**: Cycle Time, Throughput, Waste Percentage

6. **Hybrid/Adaptive**
   - **Features**: Mix of methodologies based on project needs
   - **Views**: Customizable based on selected methodologies
   - **Tasks**: Flexible task structure

### **Methodology + Workflow Combinations:**

- **Software Development + Scrum**: Sprint-based development with Scrum ceremonies
- **Software Development + Kanban**: Continuous flow development with WIP limits
- **Product Management + Agile**: Agile product development with iterative releases
- **Marketing + Kanban**: Campaign management with continuous flow
- **Sales + Agile**: Agile sales process with iterative deal progression
- **Operations + Lean**: Lean operations with waste elimination

---

## 🏗️ Architecture Plan

### 🔑 Key Design Principles

1. **Context-Aware Terminology**: Terminology is determined by the current context (project, page, or user preference)
2. **Project-Level Workflow**: Each project has its own workflow type, so terminology adapts per project
3. **Multi-Workflow Support**: Users can have a primary workflow + assigned workflows from organization
4. **No Conflicts**: Since terminology is context-aware, no conflicts occur when working across workflows
5. **Backward Compatible**: All existing data and functionality remains unchanged

### Phase 1: Database Schema Updates

#### 1.1 Add Workflow Fields to User Model

```prisma
model User {
  // ... existing fields
  primaryWorkflowType  WorkflowType?  // User's primary/preferred workflow (for personal dashboard)
  assignedWorkflows    WorkflowType[] // Workflows assigned by organization (e.g., [SOFTWARE_DEVELOPMENT, SALES])
  workflowSettings     Json?          // Store workflow-specific preferences
}

enum WorkflowType {
  SOFTWARE_DEVELOPMENT
  PRODUCT_MANAGEMENT
  MARKETING
  HUMAN_RESOURCES
  LEGAL
  CUSTOMER_SERVICE
  OPERATIONS
  IT_SUPPORT
  FINANCE
  SALES
  GENERAL
}
```

#### 1.2 Add Workflow & Methodology Fields to Project Model

```prisma
model Project {
  // ... existing fields
  workflowType     WorkflowType?     // Workflow type for this specific project
  methodologyType MethodologyType?  // Methodology (Agile, Scrum, Kanban, etc.)
  // When set, this project uses workflow-specific terminology and methodology
  // When null, uses user's primary workflow or GENERAL
}

enum MethodologyType {
  AGILE
  SCRUM
  KANBAN
  WATERFALL
  LEAN
  HYBRID
  NONE  // No specific methodology
}
```

#### 1.3 Add Workflow Assignment Table (for organization-level assignments)

```prisma
model UserWorkflowAssignment {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  workflowType WorkflowType
  assignedBy  String?      // User ID who assigned this workflow
  assignedAt  DateTime     @default(now())
  isActive    Boolean      @default(true)

  @@unique([userId, workflowType])
  @@index([userId])
}
```

#### 1.4 Add Task Templates Table (for workflow-specific task templates)

```prisma
model TaskTemplate {
  id            String        @id @default(cuid())
  workflowType  WorkflowType
  methodologyType MethodologyType?
  name          String        // Template name (e.g., "User Story", "Bug Report", "Sales Call")
  description   String?
  category      String?       // "Requirement", "Task", "Issue", "Feature", etc.

  // Template structure (JSON)
  fields        Json          // Fields with labels, types, required flags
  // Example: [
  //   { key: "title", label: "Story Title", type: "text", required: true },
  //   { key: "description", label: "Description", type: "textarea", required: true },
  //   { key: "acceptanceCriteria", label: "Acceptance Criteria", type: "list", required: true },
  //   { key: "storyPoints", label: "Story Points", type: "number", required: false }
  // ]

  // Default values
  defaultStatus TaskStatus?
  defaultPriority Priority?

  // Workflow-specific fields
  workflowFields Json?       // Additional fields specific to workflow

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([workflowType, methodologyType])
}
```

#### 1.5 Add Requirement Templates Table

```prisma
model RequirementTemplate {
  id            String        @id @default(cuid())
  workflowType  WorkflowType
  methodologyType MethodologyType?
  name          String        // Template name (e.g., "Functional Requirement", "User Story", "Campaign Brief")
  description   String?

  // Template structure
  sections      Json          // Sections with fields
  // Example for Software Dev + Scrum:
  // [
  //   { section: "User Story", fields: ["As a...", "I want...", "So that..."] },
  //   { section: "Acceptance Criteria", fields: ["Given...", "When...", "Then..."] },
  //   { section: "Technical Details", fields: ["API", "Database", "UI"] }
  // ]

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([workflowType, methodologyType])
}
```

#### 1.2 Create Workflow Configuration Table

```prisma
model WorkflowConfig {
  id              String        @id @default(cuid())
  workflowType    WorkflowType  @unique
  name            String        // Display name
  description     String?

  // Terminology mapping (JSON)
  terminology     Json          // Maps generic terms to workflow-specific terms

  // Status configurations
  projectStatuses Json          // Workflow-specific project statuses
  taskStatuses    Json          // Workflow-specific task statuses
  issueStatuses   Json          // Workflow-specific issue statuses

  // Widget configurations
  defaultWidgets  Json          // Default widgets for this workflow
  availableWidgets Json         // All available widgets

  // Field configurations
  customFields    Json          // Workflow-specific custom fields

  // Process configurations
  workflows       Json          // Workflow-specific processes/stages

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

### Phase 2: Context-Aware Terminology System

#### 2.1 Create Terminology Service

**File**: `lib/workflows/terminology.ts`

```typescript
export interface TerminologyMap {
  project: string // "Project" → "Campaign" (Marketing), "Deal" (Sales)
  projects: string // "Projects" → "Campaigns", "Deals"
  task: string // "Task" → "Ticket" (Customer Service), "User Story" (Software Dev)
  tasks: string // "Tasks" → "Tickets", "User Stories"
  issue: string // "Issue" → "Bug" (Software Dev), "Escalation" (Customer Service)
  issues: string // "Issues" → "Bugs", "Escalations"
  program: string // "Program" → "Portfolio", "Account" (Sales)
  team: string // "Team" → "Squad" (Agile), "Pod" (Product)
  // ... more mappings
}

export const workflowTerminology: Record<WorkflowType, TerminologyMap> = {
  SOFTWARE_DEVELOPMENT: {
    project: 'Product',
    projects: 'Products',
    task: 'User Story',
    tasks: 'User Stories',
    issue: 'Bug',
    issues: 'Bugs',
    program: 'Portfolio',
    team: 'Squad',
    // ...
  },
  MARKETING: {
    project: 'Campaign',
    projects: 'Campaigns',
    task: 'Marketing Activity',
    tasks: 'Marketing Activities',
    issue: 'Campaign Issue',
    issues: 'Campaign Issues',
    program: 'Marketing Program',
    team: 'Marketing Team',
    // ...
  },
  SALES: {
    project: 'Deal',
    projects: 'Deals',
    task: 'Sales Activity',
    tasks: 'Sales Activities',
    issue: 'Sales Blocker',
    issues: 'Sales Blockers',
    program: 'Account',
    team: 'Sales Team',
    // ...
  },
  // ... other workflows
  GENERAL: {
    project: 'Project',
    projects: 'Projects',
    task: 'Task',
    tasks: 'Tasks',
    issue: 'Issue',
    issues: 'Issues',
    program: 'Program',
    team: 'Team',
    // ...
  },
}

// Default terminology (fallback)
export const defaultTerminology: TerminologyMap = workflowTerminology.GENERAL
```

#### 2.2 Create Context-Aware Terminology Hook

**File**: `hooks/useWorkflowTerminology.ts`

```typescript
import { useAuthStore } from '@/stores/authStore'
import { useParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function useWorkflowTerminology() {
  const user = useAuthStore((state) => state.user)
  const params = useParams()
  const pathname = usePathname()

  // Get workflow type from context (priority order):
  // 1. Current project's workflow (if on project page)
  // 2. User's primary workflow
  // 3. GENERAL (default)

  const [workflowType, setWorkflowType] = useState<WorkflowType>(
    user?.primaryWorkflowType || WorkflowType.GENERAL
  )

  // Fetch project workflow if on project page
  useEffect(() => {
    const projectId = params?.projectId || params?.id
    if (projectId && typeof projectId === 'string') {
      fetchProjectWorkflow(projectId).then((workflow) => {
        if (workflow) setWorkflowType(workflow)
      })
    }
  }, [params])

  const getTerm = (key: keyof TerminologyMap): string => {
    return workflowTerminology[workflowType]?.[key] || defaultTerminology[key]
  }

  return {
    getTerm,
    workflowType,
    isContextAware: true, // Indicates terminology is context-aware
  }
}

async function fetchProjectWorkflow(
  projectId: string
): Promise<WorkflowType | null> {
  try {
    const response = await fetch(`/api/projects/${projectId}/workflow`)
    if (response.ok) {
      const data = await response.json()
      return data.workflowType || null
    }
  } catch (error) {
    console.error('Error fetching project workflow:', error)
  }
  return null
}
```

#### 2.3 Context Resolution Strategy

**Priority Order for Determining Workflow:**

1. **Project Context** (highest priority): If viewing/editing a specific project, use that project's workflow
2. **Page Context**: If on a workflow-specific page (e.g., `/sales/pipeline`), use that workflow
3. **User Primary Workflow**: User's selected primary workflow
4. **GENERAL** (fallback): Default terminology

**Example Scenarios:**

- User with primary workflow "Software Development" views a Sales project → Uses "Deal", "Sales Activity" terminology
- User with primary workflow "Marketing" on general dashboard → Uses "Campaign", "Marketing Activity" terminology
- User on `/projects` page with no specific project → Uses primary workflow terminology
- User on `/projects/[id]` page → Uses that project's workflow terminology

### Phase 3: Workflow-Specific Landing Pages & Views

#### 3.1 Create Workflow Landing Pages

**File Structure:**

```
app/
  workflows/
    [workflowType]/
      page.tsx              # Workflow-specific landing page
      dashboard/
        page.tsx            # Workflow dashboard
      projects/
        page.tsx            # Workflow projects list
      tasks/
        page.tsx            # Workflow tasks view
```

**Example: Software Development + Scrum Landing Page**

- **Sprint Board View**: Active sprint with columns (Backlog, To Do, In Progress, In Review, Done)
- **Product Backlog View**: Prioritized list of user stories
- **Sprint Planning View**: Sprint planning interface
- **Burndown Chart**: Sprint progress visualization
- **Daily Standup View**: Quick updates interface

**Example: Marketing + Kanban Landing Page**

- **Campaign Board**: Kanban board with campaigns in different stages
- **Content Calendar**: Visual calendar of marketing activities
- **Lead Funnel**: Visual funnel of leads through stages
- **Campaign Performance**: Real-time campaign metrics

**Example: Sales + Agile Landing Page**

- **Sales Pipeline**: Visual pipeline with deals in different stages
- **Activity Tracker**: Sales activities and follow-ups
- **Revenue Forecast**: Predictive revenue charts
- **Customer Relationship View**: CRM-like interface

#### 3.2 Methodology-Specific Views

**Scrum Views:**

- Sprint Board (columns: Backlog, To Do, In Progress, In Review, Done)
- Product Backlog (prioritized user stories)
- Sprint Planning (sprint goal, capacity, story selection)
- Sprint Review (demo-ready items)
- Sprint Retrospective (what went well, what to improve)

**Kanban Views:**

- Kanban Board (customizable columns with WIP limits)
- Cumulative Flow Diagram
- Lead Time Chart
- Throughput Metrics

**Waterfall Views:**

- Phase View (Requirements → Design → Implementation → Testing → Deployment)
- Gantt Chart (timeline view)
- Milestone Tracker
- Requirements Traceability Matrix

### Phase 4: UI Components Updates

#### 4.1 Update All UI Components

Replace hardcoded strings with terminology hooks:

**Before:**

```tsx
<h1>Projects</h1>
<Button>Create Project</Button>
```

**After:**

```tsx
const { getTerm } = useWorkflowTerminology()
<h1>{getTerm('projects')}</h1>
<Button>Create {getTerm('project')}</Button>
```

#### 4.2 Create Workflow-Aware Components

- `WorkflowBadge` - Shows status with workflow-specific colors/labels
- `WorkflowSelect` - Dropdown with workflow-specific options
- `WorkflowCard` - Card component that adapts to workflow
- `MethodologyBoard` - Board component (Sprint Board, Kanban Board, etc.)
- `WorkflowTaskForm` - Task creation form with workflow-specific fields
- `RequirementForm` - Requirement creation with workflow-specific templates

### Phase 5: Workflow-Specific Tasks & Requirements

#### 5.1 Task Templates System

**File**: `lib/workflows/task-templates.ts`

```typescript
export interface TaskTemplate {
  id: string
  workflowType: WorkflowType
  methodologyType?: MethodologyType
  name: string
  description?: string
  category: string
  fields: TaskField[]
  defaultStatus: TaskStatus
  defaultPriority: Priority
}

export interface TaskField {
  key: string
  label: string
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'select'
    | 'date'
    | 'list'
    | 'checklist'
  required: boolean
  options?: string[] // For select type
  placeholder?: string
}

// Example Templates
export const taskTemplates: Record<WorkflowType, TaskTemplate[]> = {
  SOFTWARE_DEVELOPMENT: [
    {
      id: 'user-story',
      workflowType: 'SOFTWARE_DEVELOPMENT',
      methodologyType: 'SCRUM',
      name: 'User Story',
      category: 'Requirement',
      fields: [
        { key: 'title', label: 'Story Title', type: 'text', required: true },
        { key: 'asA', label: 'As a...', type: 'text', required: true },
        { key: 'iWant', label: 'I want...', type: 'textarea', required: true },
        {
          key: 'soThat',
          label: 'So that...',
          type: 'textarea',
          required: true,
        },
        {
          key: 'acceptanceCriteria',
          label: 'Acceptance Criteria',
          type: 'list',
          required: true,
        },
        {
          key: 'storyPoints',
          label: 'Story Points',
          type: 'number',
          required: false,
        },
        {
          key: 'epic',
          label: 'Epic',
          type: 'select',
          required: false,
          options: [],
        },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'MEDIUM',
    },
    {
      id: 'bug-report',
      workflowType: 'SOFTWARE_DEVELOPMENT',
      name: 'Bug Report',
      category: 'Issue',
      fields: [
        { key: 'title', label: 'Bug Title', type: 'text', required: true },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: true,
        },
        {
          key: 'stepsToReproduce',
          label: 'Steps to Reproduce',
          type: 'list',
          required: true,
        },
        {
          key: 'expectedBehavior',
          label: 'Expected Behavior',
          type: 'textarea',
          required: true,
        },
        {
          key: 'actualBehavior',
          label: 'Actual Behavior',
          type: 'textarea',
          required: true,
        },
        {
          key: 'severity',
          label: 'Severity',
          type: 'select',
          required: true,
          options: ['Critical', 'High', 'Medium', 'Low'],
        },
        {
          key: 'environment',
          label: 'Environment',
          type: 'select',
          required: false,
          options: ['Development', 'Staging', 'Production'],
        },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'HIGH',
    },
  ],
  MARKETING: [
    {
      id: 'marketing-activity',
      workflowType: 'MARKETING',
      name: 'Marketing Activity',
      category: 'Task',
      fields: [
        { key: 'title', label: 'Activity Name', type: 'text', required: true },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: true,
        },
        {
          key: 'channel',
          label: 'Channel',
          type: 'select',
          required: true,
          options: ['Email', 'Social Media', 'SEO', 'PPC', 'Content'],
        },
        {
          key: 'targetAudience',
          label: 'Target Audience',
          type: 'text',
          required: true,
        },
        { key: 'budget', label: 'Budget', type: 'number', required: false },
        {
          key: 'expectedROI',
          label: 'Expected ROI',
          type: 'number',
          required: false,
        },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'MEDIUM',
    },
  ],
  SALES: [
    {
      id: 'sales-activity',
      workflowType: 'SALES',
      name: 'Sales Activity',
      category: 'Task',
      fields: [
        { key: 'title', label: 'Activity Name', type: 'text', required: true },
        {
          key: 'type',
          label: 'Activity Type',
          type: 'select',
          required: true,
          options: [
            'Call',
            'Email',
            'Meeting',
            'Demo',
            'Proposal',
            'Follow-up',
          ],
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: true,
        },
        {
          key: 'customer',
          label: 'Customer/Prospect',
          type: 'text',
          required: true,
        },
        {
          key: 'dealValue',
          label: 'Deal Value',
          type: 'number',
          required: false,
        },
        {
          key: 'probability',
          label: 'Win Probability (%)',
          type: 'number',
          required: false,
        },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'MEDIUM',
    },
  ],
  // ... other workflows
}
```

#### 5.2 Requirement Templates System

**File**: `lib/workflows/requirement-templates.ts`

```typescript
export interface RequirementTemplate {
  id: string
  workflowType: WorkflowType
  methodologyType?: MethodologyType
  name: string
  description?: string
  sections: RequirementSection[]
}

export interface RequirementSection {
  section: string
  fields: RequirementField[]
}

export interface RequirementField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'list'
  required: boolean
  placeholder?: string
}

// Example: Software Development + Scrum User Story Template
export const requirementTemplates: Record<WorkflowType, RequirementTemplate[]> =
  {
    SOFTWARE_DEVELOPMENT: [
      {
        id: 'user-story-template',
        workflowType: 'SOFTWARE_DEVELOPMENT',
        methodologyType: 'SCRUM',
        name: 'User Story',
        sections: [
          {
            section: 'User Story',
            fields: [
              {
                key: 'asA',
                label: 'As a',
                type: 'text',
                required: true,
                placeholder: 'As a [user type]',
              },
              {
                key: 'iWant',
                label: 'I want',
                type: 'textarea',
                required: true,
                placeholder: 'I want to [action]',
              },
              {
                key: 'soThat',
                label: 'So that',
                type: 'textarea',
                required: true,
                placeholder: 'So that [benefit]',
              },
            ],
          },
          {
            section: 'Acceptance Criteria',
            fields: [
              {
                key: 'given',
                label: 'Given',
                type: 'text',
                required: false,
                placeholder: 'Given [context]',
              },
              {
                key: 'when',
                label: 'When',
                type: 'text',
                required: false,
                placeholder: 'When [action]',
              },
              {
                key: 'then',
                label: 'Then',
                type: 'text',
                required: false,
                placeholder: 'Then [outcome]',
              },
            ],
          },
          {
            section: 'Technical Details',
            fields: [
              {
                key: 'storyPoints',
                label: 'Story Points',
                type: 'number',
                required: false,
              },
              { key: 'epic', label: 'Epic', type: 'text', required: false },
              { key: 'sprint', label: 'Sprint', type: 'text', required: false },
            ],
          },
        ],
      },
    ],
    // ... other workflows
  }
```

#### 5.3 Task Creation with Templates

**Component**: `components/workflows/TaskCreationForm.tsx`

```tsx
export function TaskCreationForm({ project, workflowType, methodologyType }) {
  const templates = getTaskTemplates(workflowType, methodologyType)
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0])

  return (
    <div>
      <Select value={selectedTemplate.id} onChange={setSelectedTemplate}>
        {templates.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            {template.name}
          </SelectItem>
        ))}
      </Select>

      <Form>
        {selectedTemplate.fields.map((field) => (
          <FormField
            key={field.key}
            label={field.label}
            type={field.type}
            required={field.required}
            placeholder={field.placeholder}
          />
        ))}
      </Form>
    </div>
  )
}
```

### Phase 6: Dashboard Customization

#### 6.1 Workflow-Specific Widgets

**File**: `lib/workflows/widgets.ts`

```typescript
export const workflowWidgets: Record<WorkflowType, WidgetConfig[]> = {
  SOFTWARE_DEVELOPMENT: [
    { id: 'sprint-board', name: 'Sprint Board', component: SprintBoardWidget },
    { id: 'burndown', name: 'Sprint Burndown', component: BurndownWidget },
    { id: 'bug-tracker', name: 'Bug Tracker', component: BugTrackerWidget },
    {
      id: 'deployment',
      name: 'Deployment Pipeline',
      component: DeploymentWidget,
    },
    // ...
  ],
  MARKETING: [
    {
      id: 'campaign-performance',
      name: 'Campaign Performance',
      component: CampaignPerformanceWidget,
    },
    { id: 'lead-funnel', name: 'Lead Funnel', component: LeadFunnelWidget },
    {
      id: 'budget-tracker',
      name: 'Budget Tracker',
      component: BudgetTrackerWidget,
    },
    // ...
  ],
  // ... other workflows
}
```

#### 4.2 Update Dashboard Page

- Load workflow-specific widgets based on user's workflow
- Filter available widgets by workflow
- Set default widget layout per workflow

### Phase 7: Settings & Onboarding

#### 5.1 Add Workflow Selection to Settings

**File**: `app/settings/page.tsx`

- Add "Workflows" tab in settings
- **Primary Workflow Selection**: Dropdown to select primary workflow (for personal dashboard)
- **Assigned Workflows Display**: Show workflows assigned by organization (read-only)
- **Workflow Preview**: Show terminology preview for selected workflow
- **Multi-Workflow Indicator**: Show badge indicating user has access to multiple workflows
- Allow switching primary workflow (no data migration needed - it's just a preference)

#### 5.2 Onboarding Workflow Selection

**File**: `app/onboarding/workflow/page.tsx` (new)

- Show workflow selection screen during first login
- Display workflow cards with descriptions and examples
- User selects primary workflow
- Show preview of terminology changes
- Set user's primary workflow preference
- **Note**: User can change this later in settings

#### 5.3 Organization Workflow Assignment (Admin Feature)

**File**: `app/admin/workflows/assign/page.tsx` (new)

- Admins can assign workflows to users
- Bulk assignment by department/role
- Users automatically get access to widgets/features for assigned workflows
- No terminology conflicts because it's context-aware

### Phase 8: API Updates

#### 6.1 Update User Profile API

**File**: `app/api/user/profile/route.ts`

- Add `workflowType` to update schema
- Return workflow configuration when fetching user

#### 6.2 Create Workflow Config API

**File**: `app/api/workflows/config/route.ts`

- GET endpoint to fetch workflow configurations
- GET endpoint to fetch terminology for a workflow
- GET endpoint to fetch available widgets for a workflow

### Phase 9: Data Migration & Backward Compatibility

#### 7.1 Migration Strategy

- **Existing Users**: All existing users default to `GENERAL` workflow (no change in behavior)
- **Existing Projects**: All existing projects have `workflowType = null`, which means they use user's primary workflow or GENERAL
- **No Breaking Changes**: All existing functionality continues to work exactly as before
- **Gradual Adoption**: Users can opt-in to workflows at their own pace
- **Status Values**: Status enums remain unchanged in database, only labels change based on workflow
- **No Data Loss**: Switching workflows or assigning new ones doesn't affect existing data

#### 7.2 Backward Compatibility Guarantees

- ✅ All existing API endpoints continue to work
- ✅ All existing database queries remain valid
- ✅ All existing UI components work (they just get enhanced with terminology)
- ✅ Existing projects/tasks/issues remain unchanged
- ✅ No required migration - system works with or without workflow selection
- ✅ Default behavior (GENERAL workflow) matches current app behavior exactly

#### 7.3 Migration Script (Optional)

```typescript
// Optional: Migrate existing projects to GENERAL workflow explicitly
// This is not required but can be run for clarity
async function migrateExistingProjects() {
  await prisma.project.updateMany({
    where: { workflowType: null },
    data: { workflowType: WorkflowType.GENERAL },
  })
}
```

---

## 📁 File Structure

```
lib/
  workflows/
    terminology.ts          # Terminology mappings
    widgets.ts             # Widget configurations
    statuses.ts            # Status configurations
    config.ts              # Workflow configurations
    task-templates.ts       # Task templates per workflow
    requirement-templates.ts # Requirement templates per workflow
    methodologies.ts      # Methodology configurations
    index.ts               # Exports

hooks/
  useWorkflowTerminology.ts
  useWorkflowConfig.ts
  useWorkflowWidgets.ts
  useTaskTemplates.ts
  useRequirementTemplates.ts
  useMethodology.ts

components/
  workflows/
    WorkflowSelector.tsx       # Workflow selection component
    MethodologySelector.tsx   # Methodology selection component
    WorkflowBadge.tsx          # Status badge with workflow colors
    MethodologyBoard.tsx       # Board component (Sprint, Kanban, etc.)
    TaskCreationForm.tsx        # Task form with templates
    RequirementForm.tsx       # Requirement form with templates
    WorkflowWidgets/           # Workflow-specific widgets
      SprintBoardWidget.tsx
      CampaignPerformanceWidget.tsx
      TicketQueueWidget.tsx
      SalesPipelineWidget.tsx
      // ... etc

app/
  workflows/
    [workflowType]/
      page.tsx                 # Workflow landing page
      dashboard/
        page.tsx               # Workflow dashboard
      projects/
        page.tsx               # Workflow projects list
      tasks/
        page.tsx               # Workflow tasks view
    [workflowType]/
      [methodologyType]/
        page.tsx               # Workflow + Methodology landing page
        board/
          page.tsx             # Methodology board (Sprint, Kanban, etc.)
  onboarding/
    workflow/
      page.tsx                 # Workflow selection during onboarding
    methodology/
      page.tsx                 # Methodology selection (optional)
  api/
    workflows/
      config/
        route.ts               # Workflow configuration API
      templates/
        route.ts               # Task/Requirement templates API
      methodologies/
        route.ts               # Methodology configurations API
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)

1. ✅ Add `workflowType` and `methodologyType` to User and Project models
2. ✅ Create `WorkflowConfig`, `TaskTemplate`, `RequirementTemplate` models
3. ✅ Create terminology system
4. ✅ Create workflow hooks
5. ✅ Create methodology system
6. ✅ Update database schema

### Phase 2: Workflow Landing Pages (Week 2-3)

1. ✅ Create workflow-specific landing pages
2. ✅ Create methodology-specific views (Sprint Board, Kanban Board, etc.)
3. ✅ Implement workflow routing system
4. ✅ Create workflow navigation

### Phase 3: Task & Requirement Templates (Week 3-4)

1. ✅ Create task template system
2. ✅ Create requirement template system
3. ✅ Build task creation form with templates
4. ✅ Build requirement creation form with templates
5. ✅ Implement template selection UI

### Phase 4: Core Components (Week 4-5)

1. ✅ Create workflow selector component
2. ✅ Create methodology selector component
3. ✅ Update settings page with workflow & methodology selection
4. ✅ Create workflow-aware badge component
5. ✅ Create methodology board components
6. ✅ Update common components to use terminology

### Phase 5: Dashboard Customization (Week 5-6)

1. ✅ Create workflow-specific widgets
2. ✅ Create methodology-specific widgets
3. ✅ Update dashboard to load workflow widgets
4. ✅ Implement widget filtering by workflow & methodology
5. ✅ Set default layouts per workflow

### Phase 6: UI Updates (Week 6-7)

1. ✅ Update all pages to use terminology hooks
2. ✅ Update navigation labels
3. ✅ Update form labels and placeholders
4. ✅ Update status displays
5. ✅ Add workflow-specific navigation items

### Phase 7: Onboarding & Polish (Week 7-8)

1. ✅ Create onboarding workflow selection
2. ✅ Create optional methodology selection
3. ✅ Add workflow & methodology preview/description
4. ✅ Testing and bug fixes
5. ✅ Documentation

---

## 🎨 UI/UX Considerations

### Workflow Selection UI

- **Visual Cards**: Each workflow shown as a card with icon, name, description
- **Preview**: Show terminology preview when hovering/selecting
- **Examples**: Show example use cases for each workflow
- **Search**: Allow searching workflows by keyword

### Settings Integration

- **Workflow Tab**: New tab in settings for workflow management
- **Preview Mode**: Toggle to preview terminology changes before saving
- **Reset Option**: Easy way to revert to default workflow

### Dashboard Adaptation

- **Smart Defaults**: Automatically show relevant widgets for workflow
- **Widget Suggestions**: Suggest widgets based on workflow
- **Customizable**: Still allow users to customize widget layout

---

## 🔧 Technical Considerations

### Performance

- **Caching**: Cache workflow configurations in memory
- **Lazy Loading**: Load workflow-specific widgets on demand
- **Optimization**: Minimize re-renders when switching workflows

### Backward Compatibility

- **Default Workflow**: All existing users default to GENERAL
- **Data Preservation**: No data loss when switching workflows
- **Gradual Migration**: Allow users to migrate at their own pace

### Extensibility

- **Plugin System**: Make it easy to add new workflows
- **Custom Workflows**: Allow organizations to create custom workflows
- **Configuration Files**: Store workflow configs in JSON for easy updates

---

## 📊 Success Metrics

1. **Adoption Rate**: % of users who select a non-default workflow
2. **User Satisfaction**: Feedback on workflow relevance
3. **Feature Usage**: Usage of workflow-specific widgets
4. **Time to Value**: How quickly users find value after selecting workflow

---

## 🚦 Next Steps

1. **Review & Approve Plan**: Get stakeholder approval
2. **Create Detailed Specs**: Detailed specs for each workflow
3. **Design Mockups**: UI mockups for workflow selection and customization
4. **Start Phase 1**: Begin database schema updates
5. **Iterate**: Build incrementally and gather feedback

---

## ✅ Solutions to Key Questions

### 1. **Can users have multiple workflows? (e.g., Software Dev + Sales)**

✅ **YES - Solved with Context-Aware System**

- User selects primary workflow (for personal dashboard)
- Organization can assign additional workflows
- When working on a Sales project, terminology automatically switches to Sales terms
- When working on a Software Dev project, terminology switches to Software Dev terms
- **No conflicts** because terminology is determined by current context (project/page)

### 2. **Can organizations set a default workflow for all users?**

✅ **YES - Organization-Level Default**

- Tenant/Organization can have a default workflow
- New users inherit organization default (can override in onboarding)
- Admins can assign workflows to specific users/departments

### 3. **Should workflows be customizable per organization?**

✅ **YES - Future Enhancement**

- Start with predefined workflows
- Later: Allow organizations to customize terminology within workflows
- Store customizations in `WorkflowConfig` table

### 4. **How to handle projects created before workflow selection?**

✅ **SOLVED - Backward Compatible**

- Existing projects have `workflowType = null`
- System uses user's primary workflow or GENERAL as fallback
- Users can manually set workflow on existing projects if desired
- No data migration required

### 5. **Should we support workflow templates for quick setup?**

✅ **YES - Widget Templates**

- Each workflow has default widget configurations
- When user selects workflow, dashboard auto-configures with relevant widgets
- Users can still customize after setup

## 🛡️ Conflict Prevention Strategy

### How We Prevent Terminology Conflicts:

1. **Context is King**: Terminology always determined by current context (project > page > user preference)
2. **Project-Level Workflow**: Each project has its own workflow, so mixed workflows in one org work perfectly
3. **Isolated Contexts**: When viewing a Software Dev project, you see Software Dev terms. When viewing a Sales project, you see Sales terms.
4. **No Global State Conflicts**: Terminology is not stored globally - it's computed on-demand based on context
5. **Fallback Chain**: Always has a fallback (GENERAL) so system never breaks

### Example: User Working Across Multiple Workflows

**Scenario**: User has primary workflow "Software Development" but is assigned to Sales workflow by company

1. **On Personal Dashboard**: Uses "Software Development" terminology (Products, User Stories, Bugs)
2. **Viewing Sales Project**: Automatically switches to "Sales" terminology (Deals, Sales Activities, Sales Blockers)
3. **Viewing Software Dev Project**: Uses "Software Development" terminology (Products, User Stories, Bugs)
4. **On General Projects Page**: Uses primary workflow ("Software Development") terminology
5. **No Confusion**: User sees appropriate terms for each context

### Technical Implementation:

```typescript
// Terminology is computed per-component, not stored globally
function ProjectCard({ project }) {
  const { getTerm } = useWorkflowTerminology() // Gets workflow from project context
  // This component automatically uses correct terminology for THIS project

  return (
    <div>
      <h3>{project.name}</h3>
      <p>
        Status: {getTerm('project')} is {project.status}
      </p>
      {/* If project.workflowType = SALES, shows "Deal"
          If project.workflowType = SOFTWARE_DEVELOPMENT, shows "Product" */}
    </div>
  )
}
```

---

## 📝 Notes

- This is a comprehensive customization system that will make wrkportal.com highly adaptable
- **Zero Breaking Changes**: System is fully backward compatible
- **Context-Aware Design**: Prevents all terminology conflicts through smart context resolution
- **Multi-Workflow Support**: Users can seamlessly work across multiple workflows
- **Workflow-Specific Pages**: Each workflow has its own optimized landing page and views
- **Methodology Support**: Each workflow can use different methodologies (Agile, Scrum, Kanban, etc.)
- **Task & Requirement Templates**: Workflow-specific templates for creating tasks and requirements
- Start with 3-4 workflows (Software Dev, Marketing, Sales, General) and expand
- Start with 2-3 methodologies (Scrum, Kanban, Waterfall) and expand
- Focus on terminology, landing pages, and templates first, then add workflow-specific processes
- Keep the architecture flexible for future additions

## 🎯 Key Features Summary

### ✅ Workflow-Specific Landing Pages

- Each workflow has its own optimized landing page
- Different views based on workflow (Sprint Board for Scrum, Kanban Board for Kanban, etc.)
- Workflow-specific navigation and features

### ✅ Methodology-Based Workflows

- Support for Agile, Scrum, Kanban, Waterfall, Lean, Hybrid
- Methodology-specific views and boards
- Methodology-specific task structures and processes

### ✅ Task & Requirement Templates

- Pre-defined templates for each workflow
- Methodology-specific templates (e.g., User Story for Scrum)
- Customizable fields based on workflow needs
- Easy task/requirement creation with guided forms

### ✅ Context-Aware System

- Terminology adapts based on project workflow
- No conflicts when working across multiple workflows
- Seamless switching between workflows

## 🎯 Impact on Current App

### ✅ What WON'T Change:

- All existing functionality continues to work
- All existing data remains unchanged
- All existing API endpoints work as before
- All existing UI components work (they get enhanced, not replaced)
- Default behavior matches current app exactly

### ✨ What WILL Change (Enhancements):

- Users can optionally select a workflow during onboarding
- Terminology adapts based on context (enhancement, not replacement)
- Dashboard can show workflow-specific widgets (addition, not removal)
- Settings page gets new "Workflows" tab
- Projects can optionally have a workflow type assigned

### 🔄 Migration Path:

1. **Phase 1**: Add database fields (nullable, defaults to null) - **No impact**
2. **Phase 2**: Add terminology system (uses GENERAL as default) - **No impact**
3. **Phase 3**: Update components to use terminology hooks (fallback to current terms) - **No impact**
4. **Phase 4**: Add workflow selection UI - **Optional feature**
5. **Phase 5**: Add workflow-specific widgets - **Optional feature**

**Result**: System works exactly as before, with optional enhancements available
