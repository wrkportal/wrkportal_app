'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Target, Plus, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { PipelineStagesGuide } from '@/components/sales/pipeline-stages-guide'
import { StageTooltip } from '@/components/sales/stage-tooltip'
import { ChevronDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Opportunity {
  id: string
  name: string
  account: {
    id: string
    name: string
  } | null
  stage: string
  amount: number
  probability: number
  expectedCloseDate: string
  status: string
  owner: {
    id: string
    name: string | null
    email: string
  }
}

const stages = [
  'PROSPECTING',
  'QUALIFICATION',
  'NEEDS_ANALYSIS',
  'VALUE_PROPOSITION',
  'ID_DECISION_MAKERS',
  'PERCEPTION_ANALYSIS',
  'PROPOSAL_PRICE_QUOTE',
  'NEGOTIATION_REVIEW',
  'CLOSED_WON',
  'CLOSED_LOST',
]

interface Account {
  id: string
  name: string
}

export default function OpportunitiesPage() {
  const searchParams = useSearchParams()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    accountId: '',
    description: '',
    stage: 'PROSPECTING',
    amount: '',
    probability: '10',
    expectedCloseDate: '',
    type: '',
    leadSource: '',
    nextStep: '',
  })

  useEffect(() => {
    fetchOpportunities()
    fetchAccounts()
  }, [])

  // Open dialog if create parameter is present
  useEffect(() => {
    if (searchParams?.get('create') === 'true') {
      setIsDialogOpen(true)
    }
  }, [searchParams])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/sales/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sales/opportunities')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch opportunities' }))
        console.error('Error fetching opportunities:', errorData)
        setOpportunities([])
        return
      }

      const data = await response.json()
      setOpportunities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      setOpportunities([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStage = async (opportunityId: string, newStage: string) => {
    setUpdatingStageId(opportunityId)
    try {
      const response = await fetch(`/api/sales/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (response.ok) {
        // Refresh opportunities to reflect the change
        await fetchOpportunities()
      } else {
        const error = await response.json()
        alert(`Failed to update stage: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating stage:', error)
      alert('An error occurred while updating the stage. Please try again.')
    } finally {
      setUpdatingStageId(null)
    }
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      PROSPECTING: 'bg-gray-100 text-gray-800',
      QUALIFICATION: 'bg-blue-100 text-blue-800',
      NEEDS_ANALYSIS: 'bg-purple-100 text-purple-800',
      VALUE_PROPOSITION: 'bg-indigo-100 text-indigo-800',
      ID_DECISION_MAKERS: 'bg-yellow-100 text-yellow-800',
      PERCEPTION_ANALYSIS: 'bg-orange-100 text-orange-800',
      PROPOSAL_PRICE_QUOTE: 'bg-pink-100 text-pink-800',
      NEGOTIATION_REVIEW: 'bg-red-100 text-red-800',
      CLOSED_WON: 'bg-green-100 text-green-800',
      CLOSED_LOST: 'bg-gray-100 text-gray-800',
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  const opportunitiesByStage = stages.reduce((acc, stage) => {
    acc[stage] = opportunities.filter((opp) => opp.stage === stage && opp.status === 'OPEN')
    return acc
  }, {} as Record<string, Opportunity[]>)

  const totalPipeline = opportunities
    .filter((o) => o.status === 'OPEN')
    .reduce((sum, o) => sum + parseFloat(o.amount.toString()), 0)

  const weightedPipeline = opportunities
    .filter((o) => o.status === 'OPEN')
    .reduce((sum, o) => sum + (parseFloat(o.amount.toString()) * o.probability) / 100, 0)

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name: formData.name,
        accountId: formData.accountId || undefined,
        description: formData.description || undefined,
        stage: formData.stage,
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        probability: formData.probability ? parseInt(formData.probability) : 10,
        expectedCloseDate: formData.expectedCloseDate || new Date().toISOString(),
        type: formData.type || undefined,
        leadSource: formData.leadSource || undefined,
        nextStep: formData.nextStep || undefined,
      }

      const response = await fetch('/api/sales/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setFormData({
          name: '',
          accountId: '',
          description: '',
          stage: 'PROSPECTING',
          amount: '',
          probability: '10',
          expectedCloseDate: '',
          type: '',
          leadSource: '',
          nextStep: '',
        })
        fetchOpportunities()
      }
    } catch (error) {
      console.error('Error creating opportunity:', error)
    }
  }

  return (
    <SalesPageLayout
      title="Sales Pipeline"
      description="Track deals through the sales pipeline"
    >
      <div className="space-y-6">
        {/* Header with New Opportunity Button and Guide */}
        <div className="flex items-center justify-between">
          <PipelineStagesGuide />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Opportunity</DialogTitle>
                <DialogDescription>
                  Add a new sales opportunity to track through the pipeline
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOpportunity} className="space-y-4">
                <div>
                  <Label htmlFor="name">Opportunity Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter opportunity name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountId">Account</Label>
                    <Select
                      value={formData.accountId || undefined}
                      onValueChange={(value) => setFormData({ ...formData, accountId: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="stage">Stage *</Label>
                      <StageTooltip stage={formData.stage} />
                    </div>
                    <Select
                      value={formData.stage}
                      onValueChange={(value) => setFormData({ ...formData, stage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROSPECTING">Prospecting</SelectItem>
                        <SelectItem value="QUALIFICATION">Qualification</SelectItem>
                        <SelectItem value="NEEDS_ANALYSIS">Needs Analysis</SelectItem>
                        <SelectItem value="VALUE_PROPOSITION">Value Proposition</SelectItem>
                        <SelectItem value="ID_DECISION_MAKERS">ID Decision Makers</SelectItem>
                        <SelectItem value="PERCEPTION_ANALYSIS">Perception Analysis</SelectItem>
                        <SelectItem value="PROPOSAL_PRICE_QUOTE">Proposal/Price Quote</SelectItem>
                        <SelectItem value="NEGOTIATION_REVIEW">Negotiation/Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="probability">Probability (%)</Label>
                    <Input
                      id="probability"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expectedCloseDate">Expected Close Date *</Label>
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="e.g., New Business, Renewal"
                    />
                  </div>

                  <div>
                    <Label htmlFor="leadSource">Lead Source</Label>
                    <Input
                      id="leadSource"
                      value={formData.leadSource}
                      onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                      placeholder="e.g., Website, Referral"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nextStep">Next Step</Label>
                  <Input
                    id="nextStep"
                    value={formData.nextStep}
                    onChange={(e) => setFormData({ ...formData, nextStep: e.target.value })}
                    placeholder="Describe the next step"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Enter opportunity description"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Opportunity</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pipeline Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalPipeline / 1000).toFixed(1)}K
              </div>
              <p className="text-xs text-muted-foreground">
                {opportunities.filter((o) => o.status === 'OPEN').length} open opportunities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weighted Pipeline</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(weightedPipeline / 1000).toFixed(1)}K
              </div>
              <p className="text-xs text-muted-foreground">
                Probability-weighted value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed Won</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {(
                  opportunities
                    .filter((o) => o.status === 'WON')
                    .reduce((sum, o) => sum + parseFloat(o.amount.toString()), 0) / 1000
                ).toFixed(1)}
                K
              </div>
              <p className="text-xs text-muted-foreground">
                {opportunities.filter((o) => o.status === 'WON').length} won deals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline View */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pipeline by Stage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {stages.map((stage) => {
              const stageOpps = opportunitiesByStage[stage] || []
              const stageValue = stageOpps.reduce(
                (sum, o) => sum + parseFloat(o.amount.toString()),
                0
              )

              return (
                <Card key={stage} className="min-h-[400px]">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className={getStageColor(stage)}>{stage.replace(/_/g, ' ')}</Badge>
                        <StageTooltip stage={stage} />
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {stageOpps.length} deals • ${(stageValue / 1000).toFixed(1)}K
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {loading ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        Loading...
                      </div>
                    ) : stageOpps.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No opportunities
                      </div>
                    ) : (
                      stageOpps.map((opp) => (
                        <Card 
                          key={opp.id}
                          className="p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Link
                              href={`/sales-dashboard/opportunities/${opp.id}`}
                              className="flex-1"
                            >
                              <div className="font-medium text-sm mb-1">{opp.name}</div>
                              {opp.account && (
                                <div className="text-xs text-muted-foreground mb-2">
                                  {opp.account.name}
                                </div>
                              )}
                            </Link>
                            <Select
                              value={opp.stage}
                              onValueChange={(newStage) => handleUpdateStage(opp.id, newStage)}
                              disabled={updatingStageId === opp.id}
                            >
                              <SelectTrigger 
                                className="w-auto h-6 px-2 text-xs border-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PROSPECTING">Prospecting</SelectItem>
                                <SelectItem value="QUALIFICATION">Qualification</SelectItem>
                                <SelectItem value="NEEDS_ANALYSIS">Needs Analysis</SelectItem>
                                <SelectItem value="VALUE_PROPOSITION">Value Proposition</SelectItem>
                                <SelectItem value="ID_DECISION_MAKERS">ID Decision Makers</SelectItem>
                                <SelectItem value="PERCEPTION_ANALYSIS">Perception Analysis</SelectItem>
                                <SelectItem value="PROPOSAL_PRICE_QUOTE">Proposal/Price Quote</SelectItem>
                                <SelectItem value="NEGOTIATION_REVIEW">Negotiation/Review</SelectItem>
                                <SelectItem value="CLOSED_WON">Closed Won</SelectItem>
                                <SelectItem value="CLOSED_LOST">Closed Lost</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Link
                            href={`/sales-dashboard/opportunities/${opp.id}`}
                            className="block"
                          >
                            <div className="text-lg font-bold mb-1">
                              ${(parseFloat(opp.amount.toString()) / 1000).toFixed(1)}K
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <Progress value={opp.probability} className="h-2 flex-1 mr-2" />
                              <span className="text-xs text-muted-foreground">
                                {opp.probability}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(opp.expectedCloseDate).toLocaleDateString()}
                            </div>
                          </Link>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </SalesPageLayout>
  )
}
