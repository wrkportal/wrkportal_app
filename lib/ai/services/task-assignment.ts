/**
 * Intelligent Task Assignment Service
 */

import { extractStructuredData } from '../ai-service'
import { PROMPTS } from '../prompts'
import { TaskAssignmentRecommendation, TaskAssignmentAnalysis } from '@/types/ai'
import { Task, User, Skill } from '@/types'

interface TaskAssignmentContext {
  task: Task
  availableUsers: User[]
  userWorkloads: { userId: string; currentHours: number; capacity: number }[]
  similarTaskHistory?: { userId: string; taskId: string; successRating: number }[]
}

export async function recommendTaskAssignment(
  context: TaskAssignmentContext
): Promise<TaskAssignmentAnalysis> {
  const taskDetails = `
Task Assignment Analysis:

**Task to Assign:**
- Title: ${context.task.title}
- Description: ${context.task.description || 'N/A'}
- Priority: ${context.task.priority}
- Estimated Hours: ${context.task.estimatedHours || 'Not specified'}
- Due Date: ${context.task.dueDate ? new Date(context.task.dueDate).toLocaleDateString() : 'Not set'}
- Required Skills: ${context.task.tags.join(', ') || 'General'}

**Available Team Members:**
${context.availableUsers.map((user, idx) => {
  const workload = context.userWorkloads.find(w => w.userId === user.id)
  const utilization = workload ? ((workload.currentHours / workload.capacity) * 100).toFixed(0) : 'Unknown'
  
  return `
${idx + 1}. ${user.firstName} ${user.lastName}
   - Role: ${user.role}
   - Skills: ${user.skills?.map(s => `${s.name} (${s.level})`).join(', ') || 'None listed'}
   - Current Utilization: ${utilization}%
   - Capacity: ${workload?.capacity || 40} hrs/week
`
}).join('\n')}

${context.similarTaskHistory?.length ? `
**Historical Performance on Similar Tasks:**
${context.similarTaskHistory.map(h => {
  const user = context.availableUsers.find(u => u.id === h.userId)
  return `- ${user?.firstName} ${user?.lastName}: Success Rating ${h.successRating}/10`
}).join('\n')}
` : ''}

Recommend the best team member(s) for this task with detailed reasoning.
`

  const schema = `{
  "recommendations": [{
    "userId": "string",
    "userName": "string",
    "score": number (0-100),
    "reasoning": "string",
    "skillMatch": number (0-100),
    "availabilityScore": number (0-100),
    "workloadScore": number (0-100),
    "performanceScore": number (0-100),
    "growthOpportunity": boolean,
    "confidence": number (0-100)
  }]
}`

  const result = await extractStructuredData<any>(taskDetails, schema, PROMPTS.TASK_ASSIGNMENT)

  return {
    taskId: context.task.id,
    recommendations: result.recommendations,
    analyzedAt: new Date(),
  }
}

/**
 * Calculate skill match score
 */
export function calculateSkillMatch(requiredSkills: string[], userSkills: Skill[]): number {
  if (requiredSkills.length === 0) return 50 // Neutral if no specific skills required

  const userSkillNames = userSkills.map(s => s.name.toLowerCase())
  const matchingSkills = requiredSkills.filter(rs => 
    userSkillNames.some(us => us.includes(rs.toLowerCase()) || rs.toLowerCase().includes(us))
  )

  const matchPercentage = (matchingSkills.length / requiredSkills.length) * 100
  
  // Bonus for skill level
  const avgLevel = userSkills.reduce((sum, s) => {
    const levelScore = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 }[s.level] || 1
    return sum + levelScore
  }, 0) / (userSkills.length || 1)
  
  const levelBonus = (avgLevel / 4) * 20 // Up to 20 bonus points
  
  return Math.min(100, matchPercentage + levelBonus)
}

/**
 * Get workload score (higher = more available)
 */
export function calculateWorkloadScore(currentHours: number, capacity: number): number {
  const utilization = currentHours / capacity
  if (utilization >= 1.0) return 0 // Fully utilized
  if (utilization >= 0.9) return 20 // Almost full
  if (utilization >= 0.7) return 50 // Busy but available
  if (utilization >= 0.5) return 80 // Good availability
  return 100 // Lots of capacity
}

