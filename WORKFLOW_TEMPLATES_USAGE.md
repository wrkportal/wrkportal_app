# 📝 Workflow Templates Usage Guide

## Overview

The workflow templates system allows users to create tasks and requirements using pre-defined templates that are specific to their workflow type and methodology.

---

## 🎯 Components

### 1. TaskCreationFormWithTemplates

A complete task creation form with template selection.

**Usage:**
```tsx
import { TaskCreationFormWithTemplates } from '@/components/workflows'
import { WorkflowType } from '@/lib/workflows/terminology'
import { MethodologyType } from '@/lib/workflows/methodologies'

function MyComponent() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleTaskSubmit = async (taskData: any) => {
    // taskData contains:
    // - title: string
    // - description: string (formatted from template fields)
    // - projectId: string | null
    // - status: string
    // - priority: string
    // - templateData: { templateId, templateFields }

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...taskData,
        // Add other required fields
        assigneeId: user?.id,
        tenantId: user?.tenantId,
      }),
    })

    if (response.ok) {
      // Task created successfully
      console.log('Task created!')
    }
  }

  return (
    <TaskCreationFormWithTemplates
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      onSubmit={handleTaskSubmit}
      projectId="project-123" // Optional
      workflowType={WorkflowType.SOFTWARE_DEVELOPMENT} // Optional, uses context if not provided
      methodologyType={MethodologyType.SCRUM} // Optional
    />
  )
}
```

### 2. RequirementCreationForm

A form for creating requirements using templates.

**Usage:**
```tsx
import { RequirementCreationForm } from '@/components/workflows'

function MyComponent() {
  const handleRequirementSubmit = async (requirementData: any) => {
    // requirementData contains:
    // - title: string
    // - description: string (formatted from template sections)
    // - templateId: string
    // - templateData: Record<string, any>

    // Save requirement to your system
    console.log('Requirement:', requirementData)
  }

  return (
    <RequirementCreationForm
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      onSubmit={handleRequirementSubmit}
      workflowType={WorkflowType.SOFTWARE_DEVELOPMENT}
      methodologyType={MethodologyType.SCRUM}
    />
  )
}
```

### 3. TaskTemplateSelector

Standalone template selector component.

**Usage:**
```tsx
import { TaskTemplateSelector } from '@/components/workflows'

function MyComponent() {
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  return (
    <TaskTemplateSelector
      workflowType={WorkflowType.SOFTWARE_DEVELOPMENT}
      methodologyType={MethodologyType.SCRUM}
      onSelectTemplate={setSelectedTemplate}
      selectedTemplateId={selectedTemplate?.id}
    />
  )
}
```

### 4. DynamicFormField

Renders form fields based on field configuration.

**Usage:**
```tsx
import { DynamicFormField } from '@/components/workflows'

function MyComponent() {
  const [value, setValue] = useState('')

  const field = {
    key: 'title',
    label: 'Task Title',
    type: 'text',
    required: true,
    placeholder: 'Enter title...',
  }

  return (
    <DynamicFormField
      field={field}
      value={value}
      onChange={setValue}
    />
  )
}
```

---

## 🔧 Integration Examples

### Example 1: Add to Existing Task Dialog

Replace or enhance the existing `TaskDialog` component:

```tsx
// Option 1: Replace completely
import { TaskCreationFormWithTemplates } from '@/components/workflows'

// Option 2: Add as an option
function TaskDialog({ open, onClose, onSubmit }) {
  const [useTemplate, setUseTemplate] = useState(false)

  if (useTemplate) {
    return (
      <TaskCreationFormWithTemplates
        open={open}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )
  }

  // ... existing task dialog
}
```

### Example 2: Add to Project Page

Add template-based task creation to project detail pages:

```tsx
import { TaskCreationFormWithTemplates } from '@/components/workflows'
import { useParams } from 'next/navigation'

function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setTaskDialogOpen(true)}>
        Create Task with Template
      </Button>

      <TaskCreationFormWithTemplates
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        onSubmit={handleTaskSubmit}
        projectId={projectId}
      />
    </>
  )
}
```

### Example 3: Add to Workflow Board

Add template-based task creation to Sprint/Kanban boards:

```tsx
import { TaskCreationFormWithTemplates } from '@/components/workflows'

function SprintBoard({ workflowType }) {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setTaskDialogOpen(true)}>
        Add User Story
      </Button>

      <TaskCreationFormWithTemplates
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        onSubmit={handleTaskSubmit}
        workflowType={workflowType}
        methodologyType={MethodologyType.SCRUM}
      />
    </>
  )
}
```

---

## 📋 Supported Field Types

The `DynamicFormField` component supports:

1. **text** - Single-line text input
2. **textarea** - Multi-line text input
3. **number** - Number input
4. **date** - Date picker
5. **select** - Dropdown with options
6. **list** - Dynamic list of items (add/remove)
7. **checklist** - Checkbox list with add/remove

---

## 🎨 Template Structure

### Task Template Example

```typescript
{
  id: 'user-story',
  workflowType: WorkflowType.SOFTWARE_DEVELOPMENT,
  methodologyType: MethodologyType.SCRUM,
  name: 'User Story',
  description: 'Create a user story following Scrum format',
  category: 'Requirement',
  fields: [
    {
      key: 'title',
      label: 'Story Title',
      type: 'text',
      required: true,
    },
    {
      key: 'asA',
      label: 'As a...',
      type: 'text',
      required: true,
      placeholder: 'As a [user type]',
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
  ],
  defaultStatus: 'TODO',
  defaultPriority: 'MEDIUM',
}
```

---

## 🔄 Data Flow

1. **User selects template** → Template fields are loaded
2. **User fills form** → Data stored in component state
3. **User submits** → Form data is validated
4. **On submit** → Data is formatted:
   - Title extracted from key fields
   - Description built from all fields
   - Template metadata included
5. **Parent component** → Receives formatted data and saves to API

---

## ✅ Validation

- Required fields are validated before submission
- Errors are shown inline for each field
- Form cannot be submitted until all required fields are filled

---

## 🚀 Next Steps

To fully integrate:

1. **Update Task API** to handle `templateData` field
2. **Add template selection** to existing task creation flows
3. **Create more templates** for other workflows
4. **Add template management** UI for admins
5. **Store templates in database** (currently in code)

