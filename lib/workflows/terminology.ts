/**
 * Workflow Terminology System
 * 
 * Maps generic terms to workflow-specific terminology based on industry standards.
 * This ensures the UI uses appropriate terminology for each workflow type.
 */

export enum WorkflowType {
  SOFTWARE_DEVELOPMENT = 'SOFTWARE_DEVELOPMENT',
  PRODUCT_MANAGEMENT = 'PRODUCT_MANAGEMENT',
  MARKETING = 'MARKETING',
  HUMAN_RESOURCES = 'HUMAN_RESOURCES',
  LEGAL = 'LEGAL',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  OPERATIONS = 'OPERATIONS',
  IT_SUPPORT = 'IT_SUPPORT',
  FINANCE = 'FINANCE',
  SALES = 'SALES',
  GENERAL = 'GENERAL',
}

export interface TerminologyMap {
  project: string // "Project" → "Campaign" (Marketing), "Deal" (Sales)
  projects: string // "Projects" → "Campaigns", "Deals"
  task: string // "Task" → "Ticket" (Customer Service), "User Story" (Software Dev)
  tasks: string // "Tasks" → "Tickets", "User Stories"
  issue: string // "Issue" → "Bug" (Software Dev), "Escalation" (Customer Service)
  issues: string // "Issues" → "Bugs", "Escalations"
  program: string // "Program" → "Portfolio", "Account" (Sales)
  team: string // "Team" → "Squad" (Agile), "Pod" (Product)
  // Add more mappings as needed
  milestone?: string
  milestones?: string
  deliverable?: string
  deliverables?: string
  sprint?: string
  sprints?: string
  epic?: string
  epics?: string
}

// Default terminology (fallback)
export const defaultTerminology: TerminologyMap = {
  project: 'Project',
  projects: 'Projects',
  task: 'Task',
  tasks: 'Tasks',
  issue: 'Issue',
  issues: 'Issues',
  program: 'Program',
  team: 'Team',
  milestone: 'Milestone',
  milestones: 'Milestones',
  deliverable: 'Deliverable',
  deliverables: 'Deliverables',
}

// Workflow-specific terminology mappings
export const workflowTerminology: Record<WorkflowType, TerminologyMap> = {
  [WorkflowType.SOFTWARE_DEVELOPMENT]: {
    project: 'Product',
    projects: 'Products',
    task: 'User Story',
    tasks: 'User Stories',
    issue: 'Bug',
    issues: 'Bugs',
    program: 'Portfolio',
    team: 'Squad',
    milestone: 'Release',
    milestones: 'Releases',
    deliverable: 'Feature',
    deliverables: 'Features',
    sprint: 'Sprint',
    sprints: 'Sprints',
    epic: 'Epic',
    epics: 'Epics',
  },
  [WorkflowType.PRODUCT_MANAGEMENT]: {
    project: 'Product',
    projects: 'Products',
    task: 'Feature',
    tasks: 'Features',
    issue: 'Blocker',
    issues: 'Blockers',
    program: 'Product Portfolio',
    team: 'Pod',
    milestone: 'Release',
    milestones: 'Releases',
    deliverable: 'Feature',
    deliverables: 'Features',
    epic: 'Epic',
    epics: 'Epics',
  },
  [WorkflowType.MARKETING]: {
    project: 'Campaign',
    projects: 'Campaigns',
    task: 'Marketing Activity',
    tasks: 'Marketing Activities',
    issue: 'Campaign Issue',
    issues: 'Campaign Issues',
    program: 'Marketing Program',
    team: 'Marketing Team',
    milestone: 'Campaign Milestone',
    milestones: 'Campaign Milestones',
    deliverable: 'Marketing Asset',
    deliverables: 'Marketing Assets',
  },
  [WorkflowType.HUMAN_RESOURCES]: {
    project: 'Initiative',
    projects: 'Initiatives',
    task: 'HR Activity',
    tasks: 'HR Activities',
    issue: 'HR Concern',
    issues: 'HR Concerns',
    program: 'HR Program',
    team: 'HR Team',
    milestone: 'Program Milestone',
    milestones: 'Program Milestones',
    deliverable: 'HR Deliverable',
    deliverables: 'HR Deliverables',
  },
  [WorkflowType.LEGAL]: {
    project: 'Case',
    projects: 'Cases',
    task: 'Legal Task',
    tasks: 'Legal Tasks',
    issue: 'Legal Issue',
    issues: 'Legal Issues',
    program: 'Matter Portfolio',
    team: 'Legal Team',
    milestone: 'Case Milestone',
    milestones: 'Case Milestones',
    deliverable: 'Legal Document',
    deliverables: 'Legal Documents',
  },
  [WorkflowType.CUSTOMER_SERVICE]: {
    project: 'Support Case',
    projects: 'Support Cases',
    task: 'Ticket',
    tasks: 'Tickets',
    issue: 'Escalation',
    issues: 'Escalations',
    program: 'Support Program',
    team: 'Support Team',
    milestone: 'Resolution Milestone',
    milestones: 'Resolution Milestones',
    deliverable: 'Solution',
    deliverables: 'Solutions',
  },
  [WorkflowType.OPERATIONS]: {
    project: 'Operations Project',
    projects: 'Operations Projects',
    task: 'Operational Task',
    tasks: 'Operational Tasks',
    issue: 'Operational Issue',
    issues: 'Operational Issues',
    program: 'Operations Program',
    team: 'Operations Team',
    milestone: 'Phase',
    milestones: 'Phases',
    deliverable: 'Operational Deliverable',
    deliverables: 'Operational Deliverables',
  },
  [WorkflowType.IT_SUPPORT]: {
    project: 'IT Project',
    projects: 'IT Projects',
    task: 'IT Ticket',
    tasks: 'IT Tickets',
    issue: 'Incident',
    issues: 'Incidents',
    program: 'IT Program',
    team: 'IT Team',
    milestone: 'IT Milestone',
    milestones: 'IT Milestones',
    deliverable: 'IT Deliverable',
    deliverables: 'IT Deliverables',
  },
  [WorkflowType.FINANCE]: {
    project: 'Financial Project',
    projects: 'Financial Projects',
    task: 'Financial Task',
    tasks: 'Financial Tasks',
    issue: 'Financial Issue',
    issues: 'Financial Issues',
    program: 'Financial Program',
    team: 'Finance Team',
    milestone: 'Financial Milestone',
    milestones: 'Financial Milestones',
    deliverable: 'Financial Report',
    deliverables: 'Financial Reports',
  },
  [WorkflowType.SALES]: {
    project: 'Deal',
    projects: 'Deals',
    task: 'Sales Activity',
    tasks: 'Sales Activities',
    issue: 'Sales Blocker',
    issues: 'Sales Blockers',
    program: 'Account',
    team: 'Sales Team',
    milestone: 'Sales Stage',
    milestones: 'Sales Stages',
    deliverable: 'Proposal',
    deliverables: 'Proposals',
  },
  [WorkflowType.GENERAL]: defaultTerminology,
}

/**
 * Get terminology for a specific workflow type
 */
export function getTerminology(workflowType: WorkflowType | null | undefined): TerminologyMap {
  if (!workflowType) {
    return defaultTerminology
  }
  return workflowTerminology[workflowType] || defaultTerminology
}

/**
 * Get a specific term for a workflow type
 */
export function getTerm(
  workflowType: WorkflowType | null | undefined,
  key: keyof TerminologyMap
): string {
  const terminology = getTerminology(workflowType)
  return terminology[key] || defaultTerminology[key] || key
}

