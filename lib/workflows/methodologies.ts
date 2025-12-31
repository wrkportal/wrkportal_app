/**
 * Methodology System
 * 
 * Defines methodology types and their configurations for different workflows.
 */

import { WorkflowType } from './terminology'

export enum MethodologyType {
  AGILE = 'AGILE',
  SCRUM = 'SCRUM',
  KANBAN = 'KANBAN',
  WATERFALL = 'WATERFALL',
  LEAN = 'LEAN',
  HYBRID = 'HYBRID',
  NONE = 'NONE',
}

export interface MethodologyConfig {
  id: MethodologyType
  name: string
  description: string
  features: string[]
  views: string[]
  compatibleWorkflows: WorkflowType[]
}

export const methodologyConfigs: Record<MethodologyType, MethodologyConfig> = {
  [MethodologyType.AGILE]: {
    id: MethodologyType.AGILE,
    name: 'Agile',
    description: 'Iterative and incremental development with sprints and continuous feedback',
    features: ['Sprints', 'User Stories', 'Backlog', 'Daily Standups', 'Retrospectives'],
    views: ['Sprint Board', 'Backlog View', 'Burndown Charts'],
    compatibleWorkflows: [
      WorkflowType.SOFTWARE_DEVELOPMENT,
      WorkflowType.PRODUCT_MANAGEMENT,
      WorkflowType.MARKETING,
      WorkflowType.SALES,
      WorkflowType.OPERATIONS,
    ],
  },
  [MethodologyType.SCRUM]: {
    id: MethodologyType.SCRUM,
    name: 'Scrum',
    description: 'Framework with fixed-length sprints, defined roles, and ceremonies',
    features: [
      'Sprints (2-4 weeks)',
      'Sprint Planning',
      'Daily Scrum',
      'Sprint Review',
      'Sprint Retrospective',
    ],
    views: ['Sprint Board', 'Product Backlog', 'Sprint Burndown'],
    compatibleWorkflows: [
      WorkflowType.SOFTWARE_DEVELOPMENT,
      WorkflowType.PRODUCT_MANAGEMENT,
      WorkflowType.OPERATIONS,
    ],
  },
  [MethodologyType.KANBAN]: {
    id: MethodologyType.KANBAN,
    name: 'Kanban',
    description: 'Continuous flow with visual board and work-in-progress limits',
    features: ['Continuous Flow', 'WIP Limits', 'Visual Board', 'Lead Time Tracking'],
    views: ['Kanban Board', 'Cumulative Flow Diagram', 'Lead Time Chart'],
    compatibleWorkflows: [
      WorkflowType.SOFTWARE_DEVELOPMENT,
      WorkflowType.MARKETING,
      WorkflowType.CUSTOMER_SERVICE,
      WorkflowType.IT_SUPPORT,
      WorkflowType.OPERATIONS,
    ],
  },
  [MethodologyType.WATERFALL]: {
    id: MethodologyType.WATERFALL,
    name: 'Waterfall',
    description: 'Sequential phases with milestones and comprehensive documentation',
    features: [
      'Sequential Phases',
      'Milestones',
      'Gantt Charts',
      'Requirements Documentation',
    ],
    views: ['Gantt Chart', 'Phase View', 'Milestone Tracker'],
    compatibleWorkflows: [
      WorkflowType.SOFTWARE_DEVELOPMENT,
      WorkflowType.LEGAL,
      WorkflowType.FINANCE,
      WorkflowType.OPERATIONS,
    ],
  },
  [MethodologyType.LEAN]: {
    id: MethodologyType.LEAN,
    name: 'Lean',
    description: 'Focus on value stream mapping and waste elimination',
    features: ['Value Stream Mapping', 'Waste Elimination', 'Continuous Improvement'],
    views: ['Value Stream Map', 'Waste Tracker', 'Improvement Board'],
    compatibleWorkflows: [
      WorkflowType.OPERATIONS,
      WorkflowType.IT_SUPPORT,
      WorkflowType.FINANCE,
    ],
  },
  [MethodologyType.HYBRID]: {
    id: MethodologyType.HYBRID,
    name: 'Hybrid',
    description: 'Mix of methodologies adapted to project needs',
    features: ['Flexible Process', 'Custom Workflows', 'Adaptive Planning'],
    views: ['Custom Board', 'Flexible Views'],
    compatibleWorkflows: [
      WorkflowType.SOFTWARE_DEVELOPMENT,
      WorkflowType.PRODUCT_MANAGEMENT,
      WorkflowType.OPERATIONS,
    ],
  },
  [MethodologyType.NONE]: {
    id: MethodologyType.NONE,
    name: 'None',
    description: 'No specific methodology - use default workflow process',
    features: [],
    views: ['Standard View'],
    compatibleWorkflows: Object.values(WorkflowType),
  },
}

/**
 * Get methodology configuration
 */
export function getMethodologyConfig(
  methodologyType: MethodologyType | null | undefined
): MethodologyConfig {
  if (!methodologyType || methodologyType === MethodologyType.NONE) {
    return methodologyConfigs[MethodologyType.NONE]
  }
  return methodologyConfigs[methodologyType] || methodologyConfigs[MethodologyType.NONE]
}

/**
 * Check if a methodology is compatible with a workflow
 */
export function isMethodologyCompatible(
  workflowType: WorkflowType,
  methodologyType: MethodologyType
): boolean {
  const config = getMethodologyConfig(methodologyType)
  return config.compatibleWorkflows.includes(workflowType)
}

/**
 * Get compatible methodologies for a workflow
 */
export function getCompatibleMethodologies(
  workflowType: WorkflowType
): MethodologyConfig[] {
  return Object.values(methodologyConfigs).filter((config) =>
    config.compatibleWorkflows.includes(workflowType)
  )
}

