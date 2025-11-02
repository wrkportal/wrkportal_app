'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Clock,
    Target,
    AlertTriangle,
    CheckCircle,
    Activity,
    BarChart3
} from 'lucide-react'

interface MonitoringTabProps {
    project: any
}

export function MonitoringTab({ project }: MonitoringTabProps) {
    const [planningData, setPlanningData] = useState<any>(null)
    const [executionData, setExecutionData] = useState<any>(null)
    const [dataLoaded, setDataLoaded] = useState(false)

    // Load planning and execution data
    useEffect(() => {
        if (project?.id) {
            loadMonitoringData()
        }
    }, [project?.id])

    const loadMonitoringData = async () => {
        try {
            // Load planning data
            const planningResponse = await fetch(`/api/projects/${project?.id}/planning`)
            if (planningResponse.ok) {
                const data = await planningResponse.json()
                setPlanningData(data.planningData || {})
            }

            // Load execution data
            const executionResponse = await fetch(`/api/projects/${project?.id}/execution`)
            if (executionResponse.ok) {
                const data = await executionResponse.json()
                setExecutionData(data.executionData || {})
            }

            setDataLoaded(true)
        } catch (error) {
            console.error('Error loading monitoring data:', error)
            setDataLoaded(true)
        }
    }

    // Calculate real metrics from actual data
    const calculateMetrics = () => {
        // WBS Tasks for schedule
        const wbsTasks = planningData?.deliverableDetails?.['1']?.wbsTasks || []
        const flattenTasks = (tasks: any[]): any[] => {
            return tasks.reduce((acc, task) => {
                acc.push(task)
                if (task.subtasks && task.subtasks.length > 0) {
                    acc.push(...flattenTasks(task.subtasks))
                }
                return acc
            }, [])
        }
        const allTasks = flattenTasks(wbsTasks)
        const wbsExecutionItems = executionData?.['1']?.items || []

        const tasksCompleted = allTasks.filter(task => {
            const execItem = wbsExecutionItems.find((item: any) => item.id === task.id)
            const actualStatus = execItem?.actualStatus || task.status
            return actualStatus === 'Done'
        }).length
        const tasksTotal = allTasks.length || 1

        // Schedule performance (actual task completion percentage)
        const schedulePerformance = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0

        // Cost metrics
        const costItems = planningData?.deliverableDetails?.['2']?.costItems || []
        const costExecutionItems = executionData?.['2']?.items || []
        let totalEstimated = 0
        let totalActual = 0
        costItems.forEach((cost: any) => {
            const execItem = costExecutionItems.find((item: any) => item.id === cost.id)
            totalEstimated += parseFloat(cost.estimatedCost) || 0
            totalActual += parseFloat(execItem?.actualCost || '0')
        })
        const costVariance = totalEstimated > 0 ? Math.round(((totalEstimated - totalActual) / totalEstimated) * 100) : 0

        // Quality metrics
        const qualityItems = planningData?.deliverableDetails?.['5']?.qualityItems || []
        const qualityExecutionItems = executionData?.['5']?.items || []
        let qualityTotal = 0
        let qualityAchieved = 0
        qualityItems.forEach((quality: any) => {
            const execItem = qualityExecutionItems.find((item: any) => item.id === quality.id)
            const actualStatus = execItem?.actualStatus || quality.status
            qualityTotal++
            if (actualStatus === 'Completed' || actualStatus === 'Exceeded') {
                qualityAchieved++
            }
        })
        const qualityScore = qualityTotal > 0 ? Math.round((qualityAchieved / qualityTotal) * 100) : 0

        // Risk assessment
        const risks = planningData?.deliverableDetails?.['3']?.riskItems || []
        const riskExecutionItems = executionData?.['3']?.items || []
        const activeRisks = risks.filter((risk: any) => {
            const execItem = riskExecutionItems.find((item: any) => item.id === risk.id)
            const actualStatus = execItem?.actualStatus || risk.status
            return actualStatus === 'Active'
        })
        const criticalRisks = activeRisks.filter((r: any) => r.severity === 'Critical').length
        const majorRisks = activeRisks.filter((r: any) => r.severity === 'Major').length

        let riskScore = 'Low'
        if (criticalRisks > 0) riskScore = 'High'
        else if (majorRisks > 1) riskScore = 'Medium'

        // Resources for team morale
        const resources = planningData?.deliverableDetails?.['6']?.resourceItems || []
        const resourceExecutionItems = executionData?.['6']?.items || []
        const overallocatedCount = resources.filter((resource: any) => {
            const execItem = resourceExecutionItems.find((item: any) => item.id === resource.id)
            const actualStatus = execItem?.actualStatus || resource.status
            return actualStatus === 'Overallocated'
        }).length
        const teamMorale = resources.length > 0 ? Math.max(50, 100 - (overallocatedCount / resources.length) * 50) : 0

        // EVM calculations
        const plannedValue = totalEstimated
        const earnedValue = totalEstimated * (tasksCompleted / tasksTotal)
        const actualCost = totalActual
        const spi = plannedValue > 0 ? earnedValue / plannedValue : 1
        const cpi = actualCost > 0 ? earnedValue / actualCost : 1
        const eac = totalEstimated / cpi
        const etc = eac - actualCost
        const vac = totalEstimated - eac

        return {
            schedulePerformance,
            costVariance,
            qualityScore,
            riskScore,
            activeRisksCount: activeRisks.length,
            criticalRisks,
            scopeCreep: 0, // Not tracked in current implementation
            teamMorale: Math.round(teamMorale),
            tasksCompleted,
            tasksTotal,
            plannedValue,
            earnedValue,
            actualCost,
            spi,
            cpi,
            eac,
            etc,
            vac
        }
    }

    const metrics = calculateMetrics()

    return (
        <div className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Schedule Performance</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold">
                                {metrics.tasksTotal > 0 ? Math.round((metrics.tasksCompleted / metrics.tasksTotal) * 100) : 0}%
                            </div>
                            {metrics.tasksCompleted / metrics.tasksTotal >= 0.5 ? (
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                        </div>
                        <Progress
                            value={metrics.tasksTotal > 0 ? (metrics.tasksCompleted / metrics.tasksTotal) * 100 : 0}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {metrics.tasksCompleted} of {metrics.tasksTotal} tasks completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cost Performance</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold">{metrics.costVariance}%</div>
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <Progress
                            value={50 + metrics.costVariance * 5}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Under budget (CV: +{metrics.costVariance}%)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.qualityScore}%</div>
                        <Progress value={metrics.qualityScore} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            Exceeding quality targets
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                {metrics.riskScore}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {metrics.activeRisksCount} active risk{metrics.activeRisksCount !== 1 ? 's' : ''}
                            {metrics.criticalRisks > 0 && ` (${metrics.criticalRisks} critical)`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Earned Value Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Earned Value Analysis (EVM)
                        </CardTitle>
                        <CardDescription>
                            Project performance against baseline
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Planned Value (PV)</p>
                                    <p className="text-lg font-bold">₹{metrics.plannedValue.toFixed(0)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Earned Value (EV)</p>
                                    <p className="text-lg font-bold">₹{metrics.earnedValue.toFixed(0)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Actual Cost (AC)</p>
                                    <p className="text-lg font-bold">₹{metrics.actualCost.toFixed(0)}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Schedule Performance Index (SPI)</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{metrics.spi.toFixed(2)}</span>
                                        <Badge variant="outline" className={
                                            metrics.spi >= 1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                        }>
                                            {metrics.spi >= 1 ? 'On Track' : 'Behind'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Cost Performance Index (CPI)</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{metrics.cpi.toFixed(2)}</span>
                                        <Badge variant="outline" className={
                                            metrics.cpi >= 1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                        }>
                                            {metrics.cpi >= 1 ? 'Under Budget' : 'Over Budget'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Estimate at Completion (EAC)</span>
                                    <span className="font-medium">₹{metrics.eac.toFixed(0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Estimate to Complete (ETC)</span>
                                    <span className="font-medium">₹{metrics.etc.toFixed(0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Variance at Completion (VAC)</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${metrics.vac >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {metrics.vac >= 0 ? '+' : ''}₹{metrics.vac.toFixed(0)}
                                        </span>
                                        {metrics.vac >= 0 ? (
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-600" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Health Indicators */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Project Health Indicators
                        </CardTitle>
                        <CardDescription>
                            Overall project health metrics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                {
                                    metric: 'Schedule',
                                    value: `${metrics.schedulePerformance}% completed`,
                                    status: metrics.schedulePerformance >= 70 ? 'green' : metrics.schedulePerformance >= 40 ? 'amber' : metrics.schedulePerformance > 0 ? 'red' : 'gray',
                                    icon: Clock
                                },
                                {
                                    metric: 'Budget',
                                    value: metrics.actualCost > 0 
                                        ? (metrics.costVariance >= 0 ? `Under by ${metrics.costVariance}%` : `Over by ${Math.abs(metrics.costVariance)}%`)
                                        : 'No budget tracked',
                                    status: metrics.actualCost === 0 ? 'gray' : (metrics.costVariance >= 0 ? 'green' : metrics.costVariance >= -10 ? 'amber' : 'red'),
                                    icon: DollarSign
                                },
                                {
                                    metric: 'Scope',
                                    value: `${metrics.tasksCompleted}/${metrics.tasksTotal} tasks completed`,
                                    status: metrics.tasksTotal === 0 ? 'gray' : (metrics.tasksCompleted / metrics.tasksTotal >= 0.7 ? 'green' : metrics.tasksCompleted / metrics.tasksTotal >= 0.4 ? 'amber' : 'red'),
                                    icon: Target
                                },
                                {
                                    metric: 'Quality',
                                    value: metrics.qualityScore > 0 ? `${metrics.qualityScore}% achievement` : 'No quality data',
                                    status: metrics.qualityScore === 0 ? 'gray' : (metrics.qualityScore >= 80 ? 'green' : metrics.qualityScore >= 60 ? 'amber' : 'red'),
                                    icon: CheckCircle
                                },
                                {
                                    metric: 'Risk',
                                    value: metrics.activeRisksCount > 0 
                                        ? `${metrics.riskScore} level (${metrics.activeRisksCount} active)`
                                        : 'No active risks',
                                    status: metrics.activeRisksCount === 0 ? 'green' : (metrics.riskScore === 'High' ? 'red' : metrics.riskScore === 'Medium' ? 'amber' : 'green'),
                                    icon: AlertTriangle
                                },
                                {
                                    metric: 'Team Morale',
                                    value: metrics.teamMorale > 0 ? `${metrics.teamMorale}% satisfaction` : 'No resource data',
                                    status: metrics.teamMorale === 0 ? 'gray' : (metrics.teamMorale >= 80 ? 'green' : metrics.teamMorale >= 60 ? 'amber' : 'red'),
                                    icon: Activity
                                },
                            ].map((indicator, index) => {
                                const Icon = indicator.icon
                                return (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium text-sm">{indicator.metric}</p>
                                                <p className="text-xs text-muted-foreground">{indicator.value}</p>
                                            </div>
                                        </div>
                                        <div
                                            className={`h-3 w-3 rounded-full ${
                                                indicator.status === 'green'
                                                    ? 'bg-green-500'
                                                    : indicator.status === 'amber'
                                                        ? 'bg-yellow-500'
                                                        : indicator.status === 'red'
                                                            ? 'bg-red-500'
                                                            : 'bg-gray-400'
                                            }`}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Quality Metrics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Quality Tracking
                        </CardTitle>
                        <CardDescription>
                            Quality deliverables progress
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Overall Quality Achievement</span>
                                    <span className="text-sm text-muted-foreground">{metrics.qualityScore}%</span>
                                </div>
                                <Progress value={metrics.qualityScore} />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Quality Metrics</p>
                                    <p className="text-2xl font-bold">
                                        {(planningData?.deliverableDetails?.['5']?.qualityItems || []).length}
                                    </p>
                                    <p className="text-xs text-muted-foreground">defined</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Achieved</p>
                                    <p className="text-2xl font-bold">
                                        {(() => {
                                            const qualityItems = planningData?.deliverableDetails?.['5']?.qualityItems || []
                                            const qualityExecutionItems = executionData?.['5']?.items || []
                                            return qualityItems.filter((q: any) => {
                                                const execItem = qualityExecutionItems.find((item: any) => item.id === q.id)
                                                const actualStatus = execItem?.actualStatus || q.status
                                                return actualStatus === 'Completed' || actualStatus === 'Exceeded'
                                            }).length
                                        })()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">completed</p>
                                </div>
                            </div>

                            {(planningData?.deliverableDetails?.['5']?.qualityItems || []).length === 0 ? (
                                <div className="text-center p-6 border rounded-lg bg-gray-50">
                                    <p className="text-sm text-muted-foreground">
                                        No quality metrics defined yet.<br />
                                        Add quality standards in Planning → Quality tab
                                    </p>
                                </div>
                            ) : (
                                <div className="pt-2">
                                    <p className="text-xs text-muted-foreground mb-2">Top Quality Metrics:</p>
                                    <div className="space-y-2">
                                        {(planningData?.deliverableDetails?.['5']?.qualityItems || []).slice(0, 3).map((quality: any, index: number) => {
                                            const execItem = (executionData?.['5']?.items || []).find((item: any) => item.id === quality.id)
                                            const actualStatus = execItem?.actualStatus || quality.status
                                            return (
                                                <div key={index} className="flex items-center justify-between text-sm">
                                                    <span className="truncate">{quality.qualityMetric}</span>
                                                    <Badge variant="outline" className={
                                                        actualStatus === 'Completed' || actualStatus === 'Exceeded' ? 'bg-green-50 text-green-700 border-green-200 text-xs' :
                                                            actualStatus === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200 text-xs' :
                                                                'bg-gray-50 text-gray-700 border-gray-200 text-xs'
                                                    }>
                                                        {actualStatus}
                                                    </Badge>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Trend Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Trend Analysis
                        </CardTitle>
                        <CardDescription>
                            Performance trends over time
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Task Completion Rate</span>
                                    <div className="flex items-center gap-1">
                                        {metrics.tasksCompleted > 0 ? (
                                            <>
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                                <span className="text-sm text-green-600">
                                                    {metrics.tasksTotal > 0 ? Math.round((metrics.tasksCompleted / metrics.tasksTotal) * 100) : 0}%
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">0%</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {metrics.tasksCompleted > 0 
                                        ? `${metrics.tasksCompleted} tasks completed out of ${metrics.tasksTotal}`
                                        : 'No tasks completed yet'}
                                </p>
                            </div>

                            <div className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Budget Utilization</span>
                                    <div className="flex items-center gap-1">
                                        {metrics.actualCost > 0 ? (
                                            <>
                                                {metrics.costVariance >= 0 ? (
                                                    <>
                                                        <TrendingDown className="h-4 w-4 text-green-600" />
                                                        <span className="text-sm text-green-600">Under budget</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingUp className="h-4 w-4 text-red-600" />
                                                        <span className="text-sm text-red-600">Over budget</span>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">No costs tracked</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {metrics.actualCost > 0 
                                        ? `₹${metrics.actualCost.toFixed(0)} spent of ₹${metrics.plannedValue.toFixed(0)} planned`
                                        : 'No budget data available yet'}
                                </p>
                            </div>

                            <div className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Active Risks</span>
                                    <div className="flex items-center gap-1">
                                        {metrics.activeRisksCount > 0 ? (
                                            <>
                                                <AlertTriangle className={`h-4 w-4 ${
                                                    metrics.criticalRisks > 0 ? 'text-red-600' : 'text-yellow-600'
                                                }`} />
                                                <span className={`text-sm ${
                                                    metrics.criticalRisks > 0 ? 'text-red-600' : 'text-yellow-600'
                                                }`}>
                                                    {metrics.activeRisksCount}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-green-600">None</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {metrics.activeRisksCount > 0 
                                        ? `${metrics.criticalRisks} critical, requires immediate attention`
                                        : 'No active risks identified'}
                                </p>
                            </div>

                            <div className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Quality Achievement</span>
                                    <div className="flex items-center gap-1">
                                        {metrics.qualityScore > 0 ? (
                                            <>
                                                {metrics.qualityScore >= 80 ? (
                                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-yellow-600" />
                                                )}
                                                <span className={`text-sm ${
                                                    metrics.qualityScore >= 80 ? 'text-green-600' : 'text-yellow-600'
                                                }`}>
                                                    {metrics.qualityScore}%
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">0%</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {metrics.qualityScore > 0 
                                        ? `Quality targets ${metrics.qualityScore >= 80 ? 'met' : 'in progress'}`
                                        : 'No quality data available yet'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

