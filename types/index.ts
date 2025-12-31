// ============================================================================
// CORE TYPES - Enterprise Project Management SaaS
// ============================================================================

// Enums and Constants
// ============================================================================

export enum UserRole {
  PLATFORM_OWNER = 'PLATFORM_OWNER',         // Platform-level super admin
  TENANT_SUPER_ADMIN = 'TENANT_SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  PMO_LEAD = 'PMO_LEAD',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_MEMBER = 'TEAM_MEMBER',
  EXECUTIVE = 'EXECUTIVE',
  RESOURCE_MANAGER = 'RESOURCE_MANAGER',
  FINANCE_CONTROLLER = 'FINANCE_CONTROLLER',
  CLIENT_STAKEHOLDER = 'CLIENT_STAKEHOLDER',
  COMPLIANCE_AUDITOR = 'COMPLIANCE_AUDITOR',
  INTEGRATION_ADMIN = 'INTEGRATION_ADMIN',
}

export enum WorkspaceType {
  ORGANIZATION = 'ORGANIZATION',  // Full enterprise features
  GROUP = 'GROUP',                // Lightweight, simplified for teams/freelancers
}

export enum GroupRole {
  OWNER = 'OWNER',    // Creator, full control
  ADMIN = 'ADMIN',    // Can invite, manage members
  MEMBER = 'MEMBER',  // Can collaborate
  GUEST = 'GUEST',    // View-only access
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  AT_RISK = 'AT_RISK',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum RAGStatus {
  RED = 'RED',
  AMBER = 'AMBER',
  GREEN = 'GREEN',
}

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  BLOCKED = 'BLOCKED',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum DependencyType {
  FINISH_TO_START = 'FINISH_TO_START',
  START_TO_START = 'START_TO_START',
  FINISH_TO_FINISH = 'FINISH_TO_FINISH',
  START_TO_FINISH = 'START_TO_FINISH',
}

export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum ChangeRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IMPLEMENTED = 'IMPLEMENTED',
}

export enum BookingType {
  HARD = 'HARD',
  SOFT = 'SOFT',
}

export enum TimesheetStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

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

export enum MethodologyType {
  AGILE = 'AGILE',
  SCRUM = 'SCRUM',
  KANBAN = 'KANBAN',
  WATERFALL = 'WATERFALL',
  LEAN = 'LEAN',
  HYBRID = 'HYBRID',
  NONE = 'NONE',
}

export enum BudgetType {
  CAPEX = 'CAPEX',
  OPEX = 'OPEX',
}

export enum CollaborationType {
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  GENERAL = 'GENERAL',
  BRAINSTORM = 'BRAINSTORM',
  REVIEW = 'REVIEW',
  PLANNING = 'PLANNING',
}

export enum CollaborationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export enum CollaborationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum SuggestionType {
  CHANGE = 'CHANGE',
  ADDITION = 'ADDITION',
  REMOVAL = 'REMOVAL',
  GENERAL = 'GENERAL',
}

export enum SuggestionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IMPLEMENTED = 'IMPLEMENTED',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

// Core Entity Types
// ============================================================================

export interface Tenant {
  id: string
  name: string
  domain: string
  region: string
  type: WorkspaceType
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL'
  dataResidency: string
  createdAt: Date
  settings: TenantSettings
}

export interface TenantSettings {
  allowedIPs?: string[]
  sessionTimeout: number
  mfaRequired: boolean
  dataRetentionDays: number
  dlpEnabled: boolean
}

export interface OrgUnit {
  id: string
  tenantId: string
  name: string
  type: 'DEPARTMENT' | 'BUSINESS_UNIT' | 'COST_CENTER' | 'SUBSIDIARY'
  parentId?: string
  managerId?: string
  description?: string
  createdAt: Date
}

export interface User {
  id: string
  tenantId: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: UserRole
  groupRole?: GroupRole
  orgUnitId?: string
  skills: Skill[]
  timezone: string
  locale: string
  landingPage?: string
  primaryWorkflowType?: WorkflowType
  workflowSettings?: Record<string, any>
  status: 'ACTIVE' | 'INACTIVE' | 'INVITED'
  lastLogin?: Date
  emailVerified?: Date | null
  createdAt: Date
}

export interface Skill {
  id: string
  name: string
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  category: string
}

export interface Role {
  id: string
  name: string
  permissions: Permission[]
  description?: string
}

export interface Permission {
  resource: string
  actions: (
    | 'READ'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'APPROVE'
    | 'EXPORT'
    | 'CONFIGURE'
  )[]
  conditions?: Record<string, any>
}

// Project Management Entities
// ============================================================================

export interface Portfolio {
  id: string
  tenantId: string
  name: string
  description?: string
  ownerId: string
  status: RAGStatus
  budget: Budget
  strategicGoals: string[]
  programs: Program[]
  createdAt: Date
  updatedAt: Date
}

export interface Program {
  id: string
  tenantId: string
  portfolioId?: string
  name: string
  description?: string
  ownerId: string
  status: RAGStatus
  startDate: Date
  endDate: Date
  budget: Budget
  projects: Project[]
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  tenantId: string
  programId?: string
  name: string
  description?: string
  code: string
  status: ProjectStatus
  ragStatus: RAGStatus
  ownerId: string
  managerId: string
  teamMembers: ProjectMember[]
  startDate: Date
  endDate: Date
  plannedStartDate: Date
  plannedEndDate: Date
  budget: Budget
  progress: number
  tags: string[]
  metadata: Record<string, any>
  workflowType?: WorkflowType
  methodologyType?: MethodologyType
  createdAt: Date
  updatedAt: Date
}

export interface ProjectMember {
  userId: string
  role: string
  allocation: number // percentage
  joinedAt: Date
}

export interface Task {
  id: string
  projectId: string
  parentId?: string // for subtasks
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  assigneeId?: string
  reporterId: string
  estimatedHours?: number
  actualHours?: number
  storyPoints?: number
  startDate?: Date
  dueDate?: Date
  completedAt?: Date
  tags: string[]
  checklist: ChecklistItem[]
  dependencies: Dependency[]
  attachments: Attachment[]
  comments: Comment[]
  createdAt: Date
  updatedAt: Date
}

export interface ChecklistItem {
  id: string
  title: string
  completed: boolean
  completedBy?: string
  completedAt?: Date
}

export interface Dependency {
  id: string
  sourceTaskId: string
  targetTaskId: string
  type: DependencyType
  lag?: number // days
}

export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  mimeType: string
  uploadedBy: string
  uploadedAt: Date
}

export interface Comment {
  id: string
  content: string
  authorId: string
  mentions: string[]
  parentId?: string // for threaded comments
  createdAt: Date
  updatedAt: Date
}

// Goal and OKR Management
// ============================================================================

export interface Goal {
  id: string
  tenantId: string
  parentId?: string
  level: 'COMPANY' | 'ORG' | 'TEAM' | 'INDIVIDUAL'
  title: string
  description?: string
  ownerId: string
  quarter: string // e.g., "Q1 2024"
  startDate: Date
  endDate: Date
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
  keyResults: KeyResult[]
  alignedGoals: string[] // child goal IDs
  createdAt: Date
  updatedAt: Date
}

export interface KeyResult {
  id: string
  goalId: string
  title: string
  type: 'PERCENTAGE' | 'NUMBER' | 'BOOLEAN'
  startValue: number
  targetValue: number
  currentValue: number
  unit?: string
  weight: number // for weighted progress
  confidence: number // 1-10 scale
  linkedInitiatives: string[] // project/task IDs
  checkIns: CheckIn[]
  createdAt: Date
  updatedAt: Date
}

export interface CheckIn {
  id: string
  value: number
  confidence: number
  narrative?: string
  userId: string
  createdAt: Date
}

// RAID (Risks, Assumptions, Issues, Dependencies)
// ============================================================================

export interface Risk {
  id: string
  projectId: string
  title: string
  description: string
  category:
    | 'TECHNICAL'
    | 'FINANCIAL'
    | 'RESOURCE'
    | 'SCHEDULE'
    | 'EXTERNAL'
    | 'QUALITY'
  probability: number // 1-5
  impact: number // 1-5
  score: number // probability × impact
  level: RiskLevel
  status: 'IDENTIFIED' | 'ASSESSED' | 'MITIGATING' | 'MONITORING' | 'CLOSED'
  ownerId: string
  mitigation?: string
  contingency?: string
  identifiedDate: Date
  reviewDate?: Date
  closedDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Issue {
  id: string
  projectId: string
  title: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  ownerId: string
  reporterId: string
  slaHours?: number
  escalationLevel: number
  resolution?: string
  identifiedDate: Date
  resolvedDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ChangeRequest {
  id: string
  projectId: string
  title: string
  description: string
  requestedBy: string
  category: 'SCOPE' | 'SCHEDULE' | 'COST' | 'QUALITY' | 'RESOURCE'
  status: ChangeRequestStatus
  priority: Priority
  impact: {
    scope?: string
    schedule?: number // days
    cost?: number
    quality?: string
  }
  justification: string
  approvers: Approver[]
  implementationPlan?: string
  requestedDate: Date
  approvedDate?: Date
  implementedDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Approver {
  userId: string
  level: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  comments?: string
  approvedAt?: Date
}

// Resource Management
// ============================================================================

export interface Resource {
  id: string
  userId: string
  availableHoursPerWeek: number
  costPerHour: number
  department: string
  location: string
  skills: Skill[]
  certifications: string[]
}

export interface Booking {
  id: string
  resourceId: string
  projectId: string
  taskId?: string
  type: BookingType
  startDate: Date
  endDate: Date
  hoursPerWeek: number
  allocation: number // percentage
  notes?: string
  createdAt: Date
}

export interface Timesheet {
  id: string
  userId: string
  weekStartDate: Date
  weekEndDate: Date
  status: TimesheetStatus
  entries: TimesheetEntry[]
  totalHours: number
  submittedAt?: Date
  approvedBy?: string
  approvedAt?: Date
  comments?: string
  createdAt: Date
  updatedAt: Date
}

export interface TimesheetEntry {
  id: string
  projectId: string
  taskId?: string
  date: Date
  hours: number
  billable: boolean
  description?: string
  chargeCode?: string
}

// Financial Management
// ============================================================================

export interface Budget {
  id: string
  entityId: string // project/program/portfolio ID
  entityType: 'PROJECT' | 'PROGRAM' | 'PORTFOLIO'
  type: BudgetType
  currency: string
  totalBudget: number
  spentToDate: number
  committed: number
  forecast: number
  variance: number
  categories: BudgetCategory[]
  createdAt: Date
  updatedAt: Date
}

export interface BudgetCategory {
  name: string
  allocated: number
  spent: number
  percentage: number
}

export interface RateCard {
  id: string
  tenantId: string
  name: string
  effectiveDate: Date
  expiryDate?: Date
  rates: Rate[]
}

export interface Rate {
  role: string
  region?: string
  currency: string
  hourlyRate: number
  billableRate?: number
}

export interface Cost {
  id: string
  projectId: string
  category: 'LABOR' | 'MATERIAL' | 'EQUIPMENT' | 'TRAVEL' | 'OTHER'
  description: string
  amount: number
  currency: string
  date: Date
  billable: boolean
  invoiced: boolean
  createdBy: string
  createdAt: Date
}

// Automation & Workflows
// ============================================================================

export interface Automation {
  id: string
  tenantId: string
  name: string
  description?: string
  enabled: boolean
  trigger: AutomationTrigger
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  createdBy: string
  executionCount: number
  lastExecutedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AutomationTrigger {
  type:
    | 'STATUS_CHANGE'
    | 'DATE_REACHED'
    | 'FIELD_UPDATED'
    | 'TASK_COMPLETED'
    | 'WEBHOOK'
  entity: 'PROJECT' | 'TASK' | 'RISK' | 'ISSUE' | 'TIMESHEET'
  event: string
}

export interface AutomationCondition {
  field: string
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN'
  value: any
}

export interface AutomationAction {
  type:
    | 'NOTIFY'
    | 'UPDATE_FIELD'
    | 'ASSIGN'
    | 'CREATE_TASK'
    | 'WEBHOOK'
    | 'EMAIL'
  config: Record<string, any>
}

// Notifications & Alerts
// ============================================================================

export interface Notification {
  id: string
  userId: string
  type:
    | 'MENTION'
    | 'ASSIGNMENT'
    | 'APPROVAL'
    | 'DEADLINE'
    | 'STATUS_CHANGE'
    | 'ESCALATION'
  title: string
  message: string
  entityType: string
  entityId: string
  actionUrl?: string
  read: boolean
  priority: Priority
  createdAt: Date
  readAt?: Date
}

// Integration & API
// ============================================================================

export interface Integration {
  id: string
  tenantId: string
  type: 'SSO' | 'SCIM' | 'WEBHOOK' | 'API' | 'DATA_SYNC'
  provider: string // e.g., 'OKTA', 'SLACK', 'JIRA'
  name: string
  enabled: boolean
  config: Record<string, any>
  lastSyncAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Webhook {
  id: string
  tenantId: string
  name: string
  url: string
  events: string[]
  enabled: boolean
  secret: string
  headers?: Record<string, string>
  retryPolicy: {
    maxAttempts: number
    backoffMultiplier: number
  }
  createdAt: Date
}

// Audit & Compliance
// ============================================================================

export interface AuditLog {
  id: string
  tenantId: string
  timestamp: Date
  userId: string
  userEmail: string
  action: string // CREATE, UPDATE, DELETE, LOGIN, PERMISSION_CHANGE
  entityType: string
  entityId: string
  changes?: Record<string, { old: any; new: any }>
  ipAddress: string
  userAgent: string
  metadata?: Record<string, any>
}

// Dashboard & Reporting
// ============================================================================

export interface Dashboard {
  id: string
  tenantId: string
  name: string
  type: 'PERSONAL' | 'TEAM' | 'EXECUTIVE' | 'PMO' | 'FINANCE'
  ownerId: string
  layout: DashboardWidget[]
  filters?: Record<string, any>
  shared: boolean
  sharedWith?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface DashboardWidget {
  id: string
  type: 'CHART' | 'TABLE' | 'METRIC' | 'TIMELINE' | 'HEATMAP' | 'GAUGE'
  title: string
  config: WidgetConfig
  position: { x: number; y: number; w: number; h: number }
}

export interface WidgetConfig {
  dataSource: string
  chartType?: 'LINE' | 'BAR' | 'PIE' | 'AREA' | 'SCATTER'
  metrics: string[]
  dimensions: string[]
  filters?: Record<string, any>
  refreshInterval?: number
}

// Templates & Baselines
// ============================================================================

export interface ProjectTemplate {
  id: string
  tenantId: string
  name: string
  description?: string
  category: string
  phases: TemplatePhase[]
  customFields: CustomField[]
  createdBy: string
  usageCount: number
  createdAt: Date
}

export interface TemplatePhase {
  id: string
  name: string
  order: number
  gates: Gate[]
  tasks: TaskTemplate[]
}

export interface Gate {
  id: string
  name: string
  criteria: string[]
  approvers: string[]
  required: boolean
}

export interface TaskTemplate {
  id: string
  title: string
  description?: string
  estimatedHours?: number
  assigneeRole?: string
  dependencies: string[]
}

export interface CustomField {
  id: string
  name: string
  type:
    | 'TEXT'
    | 'NUMBER'
    | 'DATE'
    | 'SELECT'
    | 'MULTI_SELECT'
    | 'BOOLEAN'
    | 'FORMULA'
  options?: string[]
  formula?: string
  required: boolean
  validation?: Record<string, any>
}

export interface Baseline {
  id: string
  projectId: string
  name: string
  type: 'PLANNED' | 'APPROVED' | 'MILESTONE'
  snapshotDate: Date
  scope: any
  schedule: any
  cost: any
  createdBy: string
  createdAt: Date
}

// View Types for UI
// ============================================================================

export interface ListViewConfig {
  columns: ColumnConfig[]
  filters: FilterConfig[]
  sorting: SortConfig
  grouping?: string
}

export interface ColumnConfig {
  field: string
  header: string
  width?: number
  sortable: boolean
  filterable: boolean
  visible: boolean
}

export interface FilterConfig {
  field: string
  operator: string
  value: any
}

export interface SortConfig {
  field: string
  direction: 'ASC' | 'DESC'
}

// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  metadata?: {
    total: number
    page: number
    pageSize: number
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
