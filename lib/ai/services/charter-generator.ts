/**
 * AI Project Charter Generator
 */

import { generateChatCompletion, extractStructuredData } from '../openai-service'
import { PROMPTS } from '../prompts'
import { ProjectCharter } from '@/types/ai'

interface CharterInput {
  projectName: string
  projectDescription?: string
  businessCase?: string
  goals?: string[]
  stakeholders?: string[]
  estimatedBudget?: number
  estimatedDuration?: string
  keyConstraints?: string[]
  industry?: string
  detailLevel?: 'high-level' | 'balanced' | 'detailed'
}

export async function generateProjectCharter(input: CharterInput): Promise<ProjectCharter> {
  const detailLevel = input.detailLevel || 'balanced'
  
  let detailInstructions = ''
  if (detailLevel === 'high-level') {
    detailInstructions = `
DETAIL LEVEL: HIGH-LEVEL (Keep it concise and generic)
- Use generic milestones like "Phase 1", "Phase 2", "Mid-project", "End of project"
- Budget breakdown should be percentages or ranges, not exact numbers unless provided
- Dates should be relative: "Month 1", "Q1", "Week 4" etc.
- Keep stakeholder descriptions brief
`
  } else if (detailLevel === 'detailed') {
    detailInstructions = `
DETAIL LEVEL: DETAILED (Be specific and thorough)
- Create specific milestone names with timeframes
- Provide detailed budget breakdowns that add up exactly to the total if budget given
- Use specific relative dates based on duration provided
- Include detailed stakeholder responsibilities
- Add more objectives, deliverables, and risks
`
  } else {
    detailInstructions = `
DETAIL LEVEL: BALANCED (Default - good mix of detail and brevity)
- Mix of specific and generic elements
- Budget breakdown should match total if provided, otherwise use reasonable percentages
- Use mostly relative dates unless specific calendar dates can be inferred
- Standard level of detail for stakeholders and deliverables
`
  }

  // Extract stakeholders and constraints from description if they're embedded there
  let stakeholdersText = ''
  let constraintsText = ''
  
  // Check if stakeholders/constraints are in the description
  if (input.projectDescription) {
    const stakeholderMatch = input.projectDescription.match(/\*\*Known Stakeholders:\*\*\s*([^\n]+)/i)
    const constraintMatch = input.projectDescription.match(/\*\*Constraints:\*\*\s*([^\n]+)/i)
    
    if (stakeholderMatch) stakeholdersText = stakeholderMatch[1]
    if (constraintMatch) constraintsText = constraintMatch[1]
  }
  
  // Also check direct inputs
  if (input.stakeholders?.length) {
    stakeholdersText = stakeholdersText || input.stakeholders.join(', ')
  }
  if (input.keyConstraints?.length) {
    constraintsText = constraintsText || input.keyConstraints.join(', ')
  }

  const userPrompt = `
Generate a comprehensive project charter for the following project:

**Project Name:** ${input.projectName}
${input.projectDescription ? `**Description:** ${input.projectDescription}` : ''}
${input.businessCase ? `**Business Case:** ${input.businessCase}` : ''}
${input.goals?.length ? `**Initial Goals:** ${input.goals.join(', ')}` : ''}
${stakeholdersText ? `**Known Stakeholders:** ${stakeholdersText}` : ''}
${input.estimatedBudget ? `**Total Budget:** $${input.estimatedBudget.toLocaleString()}` : ''}
${input.estimatedDuration ? `**Timeline:** ${input.estimatedDuration}` : ''}
${constraintsText ? `**Key Constraints:** ${constraintsText}` : ''}
${input.industry ? `**Industry:** ${input.industry}` : ''}

${detailInstructions}

CRITICAL REQUIREMENTS:
1. If a total budget is provided, the budget breakdown MUST add up EXACTLY to that total
2. If specific budget breakdowns are in the description (e.g., "Labor: $30,000"), USE THOSE EXACT NUMBERS
3. If specific milestones are mentioned, include them WITH their specified timeframes
4. If known stakeholders are provided, INCLUDE THEM in the stakeholder section with appropriate roles
5. If constraints are provided, reflect them in the Assumptions & Constraints section
6. Use relative dates (Month 1, Month 2) unless you can calculate actual dates from context
7. If the description contains detailed information, prioritize that over generating new details

STAKEHOLDER HANDLING:
- If stakeholders are provided (e.g., "John Smith (Sponsor), Sarah Lee (PM)"), parse them and include in the stakeholders section
- Add their names, extract their roles from parentheses if provided
- Add appropriate responsibilities based on their roles

CONSTRAINT HANDLING:
- If constraints are mentioned, include them in the "Constraints" list in the charter
- Examples: "Must complete before Q2", "Limited to 5 team members", "Budget cannot exceed $X"

Create a detailed, professional project charter following PMI/PMBOK standards.
`

  const schema = `{
  "title": "string",
  "executiveSummary": "string",
  "background": "string",
  "objectives": ["string"],
  "successCriteria": ["string"],
  "scopeInScope": ["string"],
  "scopeOutOfScope": ["string"],
  "stakeholders": [{"name": "string", "role": "string", "responsibilities": "string"}],
  "requirements": ["string"],
  "deliverables": ["string"],
  "assumptions": ["string"],
  "constraints": ["string"],
  "risks": ["string"],
  "budgetEstimate": {
    "total": number,
    "currency": "USD",
    "breakdown": [{"category": "string", "amount": number}]
  },
  "timeline": {
    "startDate": "ISO date string",
    "endDate": "ISO date string",
    "milestones": [{"name": "string", "date": "ISO date string"}]
  },
  "approvals": [{"stakeholder": "string", "role": "string", "status": "PENDING"}]
}`

  const result = await extractStructuredData<any>(
    userPrompt,
    schema,
    PROMPTS.CHARTER_GENERATOR
  )

  // Convert to ProjectCharter type
  const charter: ProjectCharter = {
    id: `charter-${Date.now()}`,
    title: result.title,
    executiveSummary: result.executiveSummary,
    background: result.background,
    objectives: result.objectives,
    successCriteria: result.successCriteria,
    scopeInScope: result.scopeInScope,
    scopeOutOfScope: result.scopeOutOfScope,
    stakeholders: result.stakeholders,
    requirements: result.requirements,
    deliverables: result.deliverables,
    assumptions: result.assumptions,
    constraints: result.constraints,
    risks: result.risks,
    budgetEstimate: result.budgetEstimate,
    timeline: {
      startDate: new Date(result.timeline.startDate),
      endDate: new Date(result.timeline.endDate),
      milestones: result.timeline.milestones.map((m: any) => ({
        name: m.name,
        date: new Date(m.date),
      })),
    },
    approvals: result.approvals,
    createdBy: 'AI',
    createdAt: new Date(),
    generatedByAI: true,
  }

  return charter
}

/**
 * Refine existing charter based on feedback
 */
export async function refineCharter(
  charter: ProjectCharter,
  feedback: string
): Promise<ProjectCharter> {
  const prompt = `
I have a project charter that needs refinement based on the following feedback:

${feedback}

Current Charter:
${JSON.stringify(charter, null, 2)}

Please update the charter to address the feedback while maintaining all other sections.
Return the complete updated charter in JSON format.
`

  const schema = JSON.stringify({
    title: 'string',
    executiveSummary: 'string',
    // ... (same as above)
  })

  const result = await extractStructuredData<any>(prompt, schema, PROMPTS.CHARTER_GENERATOR)

  return {
    ...charter,
    ...result,
    timeline: {
      startDate: new Date(result.timeline.startDate),
      endDate: new Date(result.timeline.endDate),
      milestones: result.timeline.milestones.map((m: any) => ({
        name: m.name,
        date: new Date(m.date),
      })),
    },
  }
}

