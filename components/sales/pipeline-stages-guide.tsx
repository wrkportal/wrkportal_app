'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HelpCircle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface StageInfo {
  stage: string
  name: string
  description: string
  probability: string
  keyActivities: string[]
  deliverables: string[]
  exitCriteria: string[]
  color: string
}

export const pipelineStages: StageInfo[] = [
  {
    stage: 'PROSPECTING',
    name: 'Prospecting',
    description: 'Initial stage where potential customers are identified and initial contact is made. This is the discovery phase where you identify potential opportunities.',
    probability: '10%',
    keyActivities: [
      'Identify potential customers',
      'Initial outreach (cold calls, emails, LinkedIn)',
      'Research company and decision makers',
      'Qualify basic fit (budget, authority, need, timeline)',
      'Schedule initial discovery call or meeting'
    ],
    deliverables: [
      'Lead/Contact information',
      'Initial conversation notes',
      'Basic company research',
      'Qualification checklist completed'
    ],
    exitCriteria: [
      'Contact has been made',
      'Basic qualification confirmed (BANT - Budget, Authority, Need, Timeline)',
      'Interest expressed in your solution',
      'Next meeting scheduled'
    ],
    color: 'bg-gray-100 text-gray-800'
  },
  {
    stage: 'QUALIFICATION',
    name: 'Qualification',
    description: 'Deep dive into the prospect\'s needs, budget, authority, and timeline. Determine if there\'s a real opportunity and if the prospect is a good fit for your solution.',
    probability: '20%',
    keyActivities: [
      'Conduct discovery call/meeting',
      'Assess budget and purchasing authority',
      'Identify pain points and business needs',
      'Understand decision-making process',
      'Evaluate fit with your solution',
      'Determine timeline and urgency'
    ],
    deliverables: [
      'Qualified opportunity created',
      'Discovery call notes and summary',
      'Budget confirmation',
      'Decision maker identified',
      'Timeline established'
    ],
    exitCriteria: [
      'Budget confirmed or estimated',
      'Decision maker(s) identified and engaged',
      'Clear business need established',
      'Timeline for decision confirmed',
      'Fit with solution validated'
    ],
    color: 'bg-blue-100 text-blue-800'
  },
  {
    stage: 'NEEDS_ANALYSIS',
    name: 'Needs Analysis',
    description: 'Thoroughly understand the prospect\'s business requirements, technical needs, and specific challenges. Map their needs to your solution capabilities.',
    probability: '30%',
    keyActivities: [
      'Conduct detailed requirements gathering',
      'Map business processes',
      'Identify technical requirements',
      'Assess integration needs',
      'Understand compliance and security requirements',
      'Document current state vs. desired state',
      'Identify key stakeholders and their concerns'
    ],
    deliverables: [
      'Requirements document',
      'Needs analysis summary',
      'Stakeholder map',
      'Technical requirements list',
      'Gap analysis (current vs. desired state)'
    ],
    exitCriteria: [
      'All requirements documented',
      'Stakeholder concerns addressed',
      'Technical feasibility confirmed',
      'Solution fit validated',
      'ROI/business case outlined'
    ],
    color: 'bg-purple-100 text-purple-800'
  },
  {
    stage: 'VALUE_PROPOSITION',
    name: 'Value Proposition',
    description: 'Present your solution and demonstrate how it addresses the prospect\'s specific needs. Show the value and ROI your solution will deliver.',
    probability: '40%',
    keyActivities: [
      'Prepare and deliver solution presentation',
      'Demonstrate product/service capabilities',
      'Showcase relevant case studies and success stories',
      'Quantify value proposition and ROI',
      'Address objections and concerns',
      'Customize presentation to their specific needs'
    ],
    deliverables: [
      'Solution presentation delivered',
      'ROI calculation and business case',
      'Relevant case studies shared',
      'Product demo (if applicable)',
      'Value proposition document'
    ],
    exitCriteria: [
      'Solution presented and understood',
      'Value proposition accepted',
      'ROI/business case validated',
      'Key objections addressed',
      'Interest in moving forward confirmed'
    ],
    color: 'bg-indigo-100 text-indigo-800'
  },
  {
    stage: 'ID_DECISION_MAKERS',
    name: 'Identify Decision Makers',
    description: 'Map out the decision-making unit, identify all stakeholders, understand their roles, influence, and concerns. Ensure all key players are engaged.',
    probability: '50%',
    keyActivities: [
      'Identify all decision makers and influencers',
      'Map organizational structure and relationships',
      'Understand each stakeholder\'s role and influence',
      'Identify champions and blockers',
      'Engage with each key stakeholder',
      'Understand decision-making process and criteria',
      'Address individual stakeholder concerns'
    ],
    deliverables: [
      'Stakeholder map with roles and influence',
      'Decision-making process documented',
      'Champion identified',
      'All key stakeholders engaged',
      'Individual stakeholder concerns documented'
    ],
    exitCriteria: [
      'All decision makers identified',
      'Champion secured',
      'Decision-making process understood',
      'All stakeholders engaged',
      'Decision criteria documented'
    ],
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    stage: 'PERCEPTION_ANALYSIS',
    name: 'Perception Analysis',
    description: 'Assess how the prospect perceives your solution compared to competitors. Understand their evaluation criteria and position your solution favorably.',
    probability: '60%',
    keyActivities: [
      'Identify competing solutions being evaluated',
      'Understand prospect\'s evaluation criteria',
      'Assess competitive positioning',
      'Address competitive concerns',
      'Differentiate your solution',
      'Leverage strengths and mitigate weaknesses',
      'Ensure favorable perception'
    ],
    deliverables: [
      'Competitive analysis',
      'Evaluation criteria document',
      'Competitive positioning strategy',
      'Differentiation points documented',
      'Perception assessment'
    ],
    exitCriteria: [
      'Competitive landscape understood',
      'Solution favorably positioned',
      'Competitive concerns addressed',
      'Differentiation clear',
      'Evaluation criteria aligned with your strengths'
    ],
    color: 'bg-orange-100 text-orange-800'
  },
  {
    stage: 'PROPOSAL_PRICE_QUOTE',
    name: 'Proposal/Price Quote',
    description: 'Prepare and submit a formal proposal or quote that addresses all requirements, includes pricing, terms, and conditions. This is the formal offer stage.',
    probability: '70%',
    keyActivities: [
      'Prepare detailed proposal/quote',
      'Include pricing, terms, and conditions',
      'Address all requirements and concerns',
      'Customize proposal to their specific needs',
      'Prepare contract or agreement',
      'Submit proposal and schedule follow-up',
      'Prepare for negotiations'
    ],
    deliverables: [
      'Formal proposal document',
      'Price quote with detailed breakdown',
      'Terms and conditions',
      'Contract or agreement draft',
      'Implementation timeline',
      'Support and service details'
    ],
    exitCriteria: [
      'Proposal submitted',
      'Pricing and terms presented',
      'All requirements addressed in proposal',
      'Follow-up meeting scheduled',
      'Prospect reviewing proposal'
    ],
    color: 'bg-pink-100 text-pink-800'
  },
  {
    stage: 'NEGOTIATION_REVIEW',
    name: 'Negotiation/Review',
    description: 'Negotiate terms, pricing, and conditions. Address any concerns or objections. Finalize the agreement and move toward closing the deal.',
    probability: '80%',
    keyActivities: [
      'Negotiate pricing and terms',
      'Address final objections and concerns',
      'Revise proposal based on feedback',
      'Coordinate with legal and finance teams',
      'Finalize contract terms',
      'Obtain internal approvals',
      'Prepare for contract signing'
    ],
    deliverables: [
      'Revised proposal/quote',
      'Negotiated terms document',
      'Final contract ready for signature',
      'Internal approvals obtained',
      'Implementation plan finalized'
    ],
    exitCriteria: [
      'Terms agreed upon',
      'All objections resolved',
      'Contract finalized',
      'Internal approvals complete',
      'Ready for signature'
    ],
    color: 'bg-red-100 text-red-800'
  },
  {
    stage: 'CLOSED_WON',
    name: 'Closed Won',
    description: 'Deal is closed successfully! Contract is signed, and the customer is onboarded. This is a successful outcome of the sales process.',
    probability: '100%',
    keyActivities: [
      'Contract signed and executed',
      'Payment received (or payment terms agreed)',
      'Customer onboarding initiated',
      'Handoff to implementation/customer success team',
      'Celebrate the win!',
      'Update CRM and records',
      'Schedule kickoff meeting'
    ],
    deliverables: [
      'Signed contract',
      'Purchase order (if applicable)',
      'Onboarding plan',
      'Implementation timeline',
      'Customer success handoff document'
    ],
    exitCriteria: [
      'Contract signed',
      'Deal closed in system',
      'Customer onboarded',
      'Handoff to delivery team complete'
    ],
    color: 'bg-green-100 text-green-800'
  },
  {
    stage: 'CLOSED_LOST',
    name: 'Closed Lost',
    description: 'Deal did not close successfully. Important to capture the reason for loss to learn and improve future sales efforts.',
    probability: '0%',
    keyActivities: [
      'Document loss reason',
      'Conduct win/loss analysis',
      'Update CRM records',
      'Learn from the experience',
      'Maintain relationship for future opportunities',
      'Update competitive intelligence'
    ],
    deliverables: [
      'Loss reason documented',
      'Win/loss analysis report',
      'Lessons learned',
      'Updated competitive intelligence'
    ],
    exitCriteria: [
      'Loss reason captured',
      'Records updated',
      'Analysis completed',
      'Relationship maintained (if appropriate)'
    ],
    color: 'bg-gray-100 text-gray-800'
  }
]

export function PipelineStagesGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="mr-2 h-4 w-4" />
          Pipeline Stages Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Sales Pipeline Stages Guide</DialogTitle>
          <DialogDescription>
            Understand what happens in each stage of the sales pipeline and what activities are required to move opportunities forward.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-4">
            {pipelineStages.map((stageInfo) => (
              <Card key={stageInfo.stage}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={stageInfo.color}>
                        {stageInfo.name}
                      </Badge>
                      <Badge variant="outline">
                        {stageInfo.probability} Probability
                      </Badge>
                    </div>
                    {stageInfo.stage === 'CLOSED_WON' && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {stageInfo.stage === 'CLOSED_LOST' && (
                      <XCircle className="h-5 w-5 text-gray-600" />
                    )}
                    {stageInfo.stage !== 'CLOSED_WON' && stageInfo.stage !== 'CLOSED_LOST' && (
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {stageInfo.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Key Activities</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {stageInfo.keyActivities.map((activity, idx) => (
                        <li key={idx}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Deliverables</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {stageInfo.deliverables.map((deliverable, idx) => (
                        <li key={idx}>{deliverable}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Exit Criteria (Ready to Move to Next Stage)</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {stageInfo.exitCriteria.map((criteria, idx) => (
                        <li key={idx}>{criteria}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

