/**
 * AI Agents Framework
 *
 * Defines autonomous AI agents that can be assigned to roles,
 * execute workflows, and take actions with approval gates.
 */

export interface AgentDefinition {
  id: string
  name: string
  description: string
  icon: string
  capabilities: string[]
  schedule?: string // cron expression
  approvalRequired: boolean
  category: 'project' | 'sales' | 'finance' | 'hr' | 'it' | 'operations'
}

export interface AgentAction {
  type: 'create_task' | 'update_status' | 'send_notification' | 'generate_report' | 'escalate' | 'assign' | 'comment'
  description: string
  target: string
  payload: Record<string, any>
  requiresApproval: boolean
  approved?: boolean
  executedAt?: string
}

export interface AgentExecution {
  id: string
  agentId: string
  tenantId: string
  status: 'pending' | 'running' | 'awaiting_approval' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  actions: AgentAction[]
  summary?: string
  error?: string
}

// Pre-built agent definitions
export const builtInAgents: AgentDefinition[] = [
  {
    id: 'standup-reporter',
    name: 'Standup Reporter',
    description: 'Collects daily updates from task activity and generates a standup summary for each team. Posts to collaboration channels at 9 AM.',
    icon: 'FileText',
    capabilities: ['Read task updates', 'Generate summaries', 'Post to channels'],
    schedule: '0 9 * * 1-5', // Weekdays at 9 AM
    approvalRequired: false,
    category: 'project',
  },
  {
    id: 'sprint-planner',
    name: 'Sprint Planner',
    description: 'Analyzes backlog priority, team capacity, and historical velocity to recommend optimal task distribution for upcoming sprints.',
    icon: 'Zap',
    capabilities: ['Analyze capacity', 'Score priorities', 'Suggest assignments'],
    approvalRequired: true,
    category: 'project',
  },
  {
    id: 'budget-guardian',
    name: 'Budget Guardian',
    description: 'Monitors project spending in real-time. Alerts when budgets exceed 80% threshold and suggests cost optimizations.',
    icon: 'DollarSign',
    capabilities: ['Monitor budgets', 'Detect anomalies', 'Send alerts', 'Suggest optimizations'],
    schedule: '0 8 * * *', // Daily at 8 AM
    approvalRequired: false,
    category: 'finance',
  },
  {
    id: 'lead-qualifier',
    name: 'Lead Qualifier',
    description: 'Scores inbound leads using engagement signals, company data, and historical conversion patterns. Routes qualified leads to the right sales rep.',
    icon: 'TrendingUp',
    capabilities: ['Score leads', 'Enrich data', 'Route to reps', 'Update CRM'],
    approvalRequired: false,
    category: 'sales',
  },
  {
    id: 'sla-monitor',
    name: 'SLA Monitor',
    description: 'Watches IT and support tickets in real-time. Auto-escalates tickets approaching SLA breach. Generates SLA compliance reports.',
    icon: 'Shield',
    capabilities: ['Monitor SLAs', 'Auto-escalate', 'Generate reports', 'Notify managers'],
    schedule: '*/15 * * * *', // Every 15 minutes
    approvalRequired: false,
    category: 'it',
  },
  {
    id: 'risk-scanner',
    name: 'Risk Scanner',
    description: 'Scans all active projects weekly for emerging risks — schedule slippage, resource conflicts, budget overruns, dependency bottlenecks.',
    icon: 'AlertTriangle',
    capabilities: ['Analyze timelines', 'Detect risks', 'Score severity', 'Recommend mitigations'],
    schedule: '0 7 * * 1', // Mondays at 7 AM
    approvalRequired: false,
    category: 'project',
  },
]

/**
 * Get agent definition by ID
 */
export function getAgentDefinition(agentId: string): AgentDefinition | undefined {
  return builtInAgents.find((a) => a.id === agentId)
}

/**
 * Create a new agent execution record
 */
export function createExecution(agentId: string, tenantId: string): AgentExecution {
  return {
    id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    agentId,
    tenantId,
    status: 'pending',
    startedAt: new Date().toISOString(),
    actions: [],
  }
}

/**
 * Format agent execution as a human-readable summary
 */
export function formatExecutionSummary(execution: AgentExecution): string {
  const agent = getAgentDefinition(execution.agentId)
  const actionCount = execution.actions.length
  const approvedCount = execution.actions.filter((a) => a.approved).length
  const pendingCount = execution.actions.filter((a) => a.requiresApproval && a.approved === undefined).length

  let summary = `${agent?.name || execution.agentId}: `

  if (execution.status === 'completed') {
    summary += `Completed ${actionCount} actions.`
  } else if (execution.status === 'awaiting_approval') {
    summary += `${pendingCount} actions awaiting your approval.`
  } else if (execution.status === 'failed') {
    summary += `Failed: ${execution.error || 'Unknown error'}`
  } else {
    summary += `Running... (${actionCount} actions so far)`
  }

  return summary
}
