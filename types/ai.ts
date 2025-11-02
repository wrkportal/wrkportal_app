/**
 * AI Feature Types
 */

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'function'
  content: string
  timestamp: Date
  functionCall?: {
    name: string
    arguments: string
  }
  functionResult?: any
}

export interface AIConversation {
  id: string
  userId: string
  title: string
  messages: AIMessage[]
  createdAt: Date
  updatedAt: Date
}

// Project Charter Types
export interface ProjectCharter {
  id: string
  projectId?: string
  title: string
  executiveSummary: string
  background: string
  objectives: string[]
  successCriteria: string[]
  scopeInScope: string[]
  scopeOutOfScope: string[]
  stakeholders: CharterStakeholder[]
  requirements: string[]
  deliverables: string[]
  assumptions: string[]
  constraints: string[]
  risks: string[]
  budgetEstimate: {
    total: number
    currency: string
    breakdown: { category: string; amount: number }[]
  }
  timeline: {
    startDate: Date
    endDate: Date
    milestones: { name: string; date: Date }[]
  }
  approvals: CharterApproval[]
  createdBy: string
  createdAt: Date
  generatedByAI: boolean
}

export interface CharterStakeholder {
  name: string
  role: string
  responsibilities: string
  contactInfo?: string
}

export interface CharterApproval {
  stakeholder: string
  role: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  date?: Date
  signature?: string
}

// Risk Prediction Types
export interface RiskPrediction {
  id: string
  projectId: string
  riskType: 'BUDGET' | 'SCHEDULE' | 'RESOURCE' | 'QUALITY' | 'SCOPE' | 'TECHNICAL'
  title: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  probability: number // 1-5
  impact: number // 1-5
  riskScore: number
  indicators: string[]
  rootCauses: string[]
  recommendations: string[]
  predictedBy: 'AI'
  confidence: number // 0-100
  detectedAt: Date
  status: 'NEW' | 'ACKNOWLEDGED' | 'MITIGATED' | 'CLOSED'
}

export interface RiskAnalysisResult {
  projectId: string
  overallRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  riskScore: number
  predictions: RiskPrediction[]
  summary: string
  analyzedAt: Date
}

// Status Report Types
export interface AIStatusReport {
  id: string
  projectId: string
  reportPeriod: {
    startDate: Date
    endDate: Date
  }
  executiveSummary: string
  overallHealth: 'GREEN' | 'AMBER' | 'RED'
  healthJustification: string
  accomplishments: string[]
  issues: string[]
  upcomingMilestones: { name: string; date: Date; status: string }[]
  budgetStatus: {
    summary: string
    variance: number
    concerns: string[]
  }
  resourceStatus: {
    summary: string
    concerns: string[]
  }
  risks: { title: string; severity: string; mitigation: string }[]
  decisionsNeeded: string[]
  nextSteps: string[]
  generatedAt: Date
  generatedBy: 'AI'
}

// Task Assignment Types
export interface TaskAssignmentRecommendation {
  userId: string
  userName: string
  score: number // 0-100
  reasoning: string
  skillMatch: number
  availabilityScore: number
  workloadScore: number
  performanceScore: number
  growthOpportunity: boolean
  confidence: number
}

export interface TaskAssignmentAnalysis {
  taskId: string
  recommendations: TaskAssignmentRecommendation[]
  analyzedAt: Date
}

// Meeting Analysis Types
export interface MeetingAnalysis {
  id: string
  meetingTitle: string
  meetingDate: Date
  participants: string[]
  actionItems: ActionItem[]
  decisions: Decision[]
  risksDiscussed: RiskItem[]
  followUps: FollowUpItem[]
  keyTakeaways: string[]
  analyzedAt: Date
}

export interface ActionItem {
  id: string
  description: string
  owner?: string
  dueDate?: Date
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  context: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
}

export interface Decision {
  id: string
  description: string
  rationale: string
  impact: string
  decisionMakers: string[]
}

export interface RiskItem {
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  owner?: string
}

export interface FollowUpItem {
  description: string
  owner?: string
  reason: string
}

// Budget Forecast Types
export interface BudgetForecast {
  projectId: string
  currentSpend: number
  forecastedFinalCost: number
  variance: number
  variancePercentage: number
  confidence: number
  confidenceInterval: {
    low: number
    high: number
  }
  thresholdAlerts: ThresholdAlert[]
  costOptimizations: CostOptimization[]
  assumptions: string[]
  generatedAt: Date
}

export interface ThresholdAlert {
  threshold: number
  predictedDate: Date
  daysUntil: number
  severity: 'WARNING' | 'CRITICAL'
}

export interface CostOptimization {
  category: string
  description: string
  potentialSavings: number
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
  impact: string
}

// OKR Analysis Types
export interface OKRAnalysis {
  goalId: string
  currentProgress: number
  predictedProgress: number
  onTrack: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidenceScore: number
  velocity: number
  recommendations: string[]
  blockers: string[]
  dependencies: string[]
  analyzedAt: Date
}

// Anomaly Detection Types
export interface Anomaly {
  id: string
  type: 'TASK' | 'TIME' | 'BUDGET' | 'RESOURCE' | 'VELOCITY' | 'OTHER'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  description: string
  dataPoints: { timestamp: Date; value: number }[]
  expectedRange: { min: number; max: number }
  actualValue: number
  possibleCauses: string[]
  recommendations: string[]
  detectedAt: Date
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE'
}

export interface AnomalyDetectionResult {
  projectId: string
  period: { start: Date; end: Date }
  anomalies: Anomaly[]
  summary: string
  analyzedAt: Date
}

// Smart Summary Types
export interface NotificationSummary {
  userId: string
  period: { start: Date; end: Date }
  summary: string
  urgent: {
    count: number
    items: string[]
  }
  important: {
    count: number
    items: string[]
  }
  fyi: {
    count: number
    items: string[]
  }
  totalNotifications: number
  generatedAt: Date
}

// AI Function Call Types
export interface AIFunction {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, any>
    required: string[]
  }
}

// AI Service Response Types
export interface AIServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

