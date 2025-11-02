'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    Activity,
    CheckCircle,
    Clock,
    Users,
    TrendingUp,
    AlertTriangle,
    Target,
    Zap,
    Save
} from 'lucide-react'

// Import execution tracking components
import { WBSExecution } from '@/components/execution-tracking/wbs-execution'
import { CostExecution } from '@/components/execution-tracking/cost-execution'
import { RiskExecution } from '@/components/execution-tracking/risk-execution'
import { CommunicationExecution } from '@/components/execution-tracking/communication-execution'
import { QualityExecution } from '@/components/execution-tracking/quality-execution'
import { ResourceExecution } from '@/components/execution-tracking/resource-execution'
import { ProcurementExecution } from '@/components/execution-tracking/procurement-execution'

interface ExecutionTabProps {
    project: any
}

export function ExecutionTab({ project }: ExecutionTabProps) {
    const [planningData, setPlanningData] = useState<any>(null)
    const [executionData, setExecutionData] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [dataLoaded, setDataLoaded] = useState(false)

    // Dialog states for detailed views
    const [deliverablesDialogOpen, setDeliverablesDialogOpen] = useState(false)
    const [tasksDialogOpen, setTasksDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>('')

    // Calculate real metrics from actual data
    const calculateRealMetrics = () => {
        // Get WBS tasks from planning
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
        const allWBSTasks = flattenTasks(wbsTasks)

        // Get execution status for WBS tasks
        const wbsExecutionItems = executionData?.['1']?.items || []
        const tasksWithActualStatus = allWBSTasks.map(task => {
            const execItem = wbsExecutionItems.find((item: any) => item.id === task.id)
            return {
                ...task,
                actualStatus: execItem?.actualStatus || task.status
            }
        })

        // Calculate task completion
        const tasksCompleted = tasksWithActualStatus.filter(t => t.actualStatus === 'Done').length
        const tasksTotal = allWBSTasks.length || 1 // Avoid division by zero

        // Calculate deliverables completion
        const deliverables = planningData?.deliverables || []
        const completedDeliverables = deliverables.filter((d: any) => d.status === 'completed').length

        // Calculate active work (In Progress tasks)
        const activeWorkItems = tasksWithActualStatus.filter(t =>
            t.actualStatus === 'In Progress' || t.actualStatus === 'Planned'
        ).length

        // Calculate blocked items (from risks with high impact)
        const risks = planningData?.deliverableDetails?.['3']?.riskItems || []
        const riskExecutionItems = executionData?.['3']?.items || []
        const activeRisks = risks.filter((risk: any) => {
            const execItem = riskExecutionItems.find((item: any) => item.id === risk.id)
            const actualStatus = execItem?.actualStatus || risk.status
            return actualStatus === 'Active' && risk.severity === 'Critical'
        }).length

        // Calculate resource utilization from resource data
        const resources = planningData?.deliverableDetails?.['6']?.resourceItems || []
        const resourceExecutionItems = executionData?.['6']?.items || []
        const allocatedResources = resources.filter((resource: any) => {
            const execItem = resourceExecutionItems.find((item: any) => item.id === resource.id)
            const actualStatus = execItem?.actualStatus || resource.status
            return actualStatus === 'Allocated' || actualStatus === 'Overallocated'
        }).length
        const teamUtilization = resources.length > 0
            ? Math.round((allocatedResources / resources.length) * 100)
            : 0

        // Calculate budget variance
        const costItems = planningData?.deliverableDetails?.['2']?.costItems || []
        const costExecutionItems = executionData?.['2']?.items || []
        let totalEstimated = 0
        let totalActual = 0
        costItems.forEach((cost: any) => {
            const execItem = costExecutionItems.find((item: any) => item.id === cost.id)
            totalEstimated += parseFloat(cost.estimatedCost) || 0
            totalActual += parseFloat(execItem?.actualCost || '0')
        })
        const budgetVariance = totalEstimated > 0
            ? Math.round(((totalActual - totalEstimated) / totalEstimated) * 100)
            : 0

        return {
            tasksCompleted,
            tasksTotal,
            completionRate: tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0,
            completedDeliverables,
            totalDeliverables: deliverables.length,
            activeWorkItems,
            blockedItems: activeRisks,
            teamUtilization,
            budgetVariance,
            totalEstimated,
            totalActual,
            onTrack: tasksCompleted >= tasksTotal * 0.8 // 80% or more is on track
        }
    }

    const executionMetrics = calculateRealMetrics()
    const completionRate = executionMetrics.completionRate

    // Load planning and execution data
    useEffect(() => {
        if (project?.id) {
            loadPlanningAndExecutionData()
        }
    }, [project?.id])

    const loadPlanningAndExecutionData = async () => {
        try {
            console.log('📥 Loading planning and execution data for project:', project?.id)

            // Load planning data
            const planningResponse = await fetch(`/api/projects/${project?.id}/planning`)
            if (planningResponse.ok) {
                const data = await planningResponse.json()
                console.log('📦 Loaded planning data:', data.planningData)
                setPlanningData(data.planningData || {})
            }

            // Load execution data  
            const executionResponse = await fetch(`/api/projects/${project?.id}/execution`)
            if (executionResponse.ok) {
                const data = await executionResponse.json()
                console.log('📦 Loaded execution data:', data.executionData)
                console.log('📦 Execution data keys:', Object.keys(data.executionData || {}))

                // Force a new object reference to trigger re-render
                if (data.executionData && Object.keys(data.executionData).length > 0) {
                    setExecutionData({ ...data.executionData })
                } else {
                    setExecutionData({})
                }
            }

            setDataLoaded(true)
        } catch (error) {
            console.error('❌ Error loading data:', error)
            setDataLoaded(true)
        }
    }

    const saveExecutionData = async () => {
        try {
            setIsSaving(true)

            console.log('💾 Saving execution data:', executionData)
            console.log('💾 Execution data keys being saved:', Object.keys(executionData || {}))

            const response = await fetch(`/api/projects/${project?.id}/execution`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(executionData),
            })

            if (response.ok) {
                setLastSaved(new Date())
                console.log('✅ Execution data saved successfully at', new Date().toLocaleTimeString())
            } else {
                const error = await response.json()
                console.error('❌ Failed to save execution data:', error)
                alert('Failed to save execution data')
            }
        } catch (error) {
            console.error('❌ Error saving execution data:', error)
            alert('Error saving execution data')
        } finally {
            setIsSaving(false)
        }
    }

    const updateExecutionItem = (deliverableId: string, itemId: string, field: string, value: any) => {
        const currentItems = executionData?.[deliverableId]?.items || []
        const existingItem = currentItems.find((item: any) => item.id === itemId)

        let updatedItems
        if (existingItem) {
            // Update existing item
            updatedItems = currentItems.map((item: any) =>
                item.id === itemId ? { ...item, [field]: value } : item
            )
        } else {
            // Create new item with this field
            updatedItems = [...currentItems, { id: itemId, [field]: value }]
        }

        const newExecutionData = {
            ...executionData,
            [deliverableId]: {
                ...(executionData?.[deliverableId] || {}),
                items: updatedItems
            }
        }

        console.log(`📝 Updating execution item - Deliverable: ${deliverableId}, Item: ${itemId}, Field: ${field}, Value:`, value)
        console.log('📝 New execution data structure:', newExecutionData)

        setExecutionData(newExecutionData)
    }

    const addExecutionItem = (deliverableId: string, plannedItem: any) => {
        const newItem = {
            ...plannedItem,
            actual: '',
            revised: '',
            actualStatus: plannedItem.status || 'Pending'
        }

        setExecutionData({
            ...executionData,
            [deliverableId]: {
                ...(executionData?.[deliverableId] || {}),
                items: [...(executionData?.[deliverableId]?.items || []), newItem]
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Execution Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <Progress value={completionRate} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {executionMetrics.tasksCompleted} of {executionMetrics.tasksTotal} tasks
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {executionMetrics.budgetVariance > 0 ? '+' : ''}
                            {executionMetrics.budgetVariance}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Budget variance
                        </p>
                        <Badge variant="outline" className={
                            executionMetrics.budgetVariance > 10 ? 'mt-2 bg-red-50 text-red-700 border-red-200' :
                                executionMetrics.budgetVariance > 0 ? 'mt-2 bg-orange-50 text-orange-700 border-orange-200' :
                                    'mt-2 bg-green-50 text-green-700 border-green-200'
                        }>
                            {executionMetrics.totalActual > 0
                                ? `₹${executionMetrics.totalActual.toFixed(0)} / ₹${executionMetrics.totalEstimated.toFixed(0)}`
                                : 'No actuals yet'
                            }
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Work</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{executionMetrics.activeWorkItems}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Items in progress
                        </p>
                        {executionMetrics.blockedItems > 0 && (
                            <Badge variant="outline" className="mt-2 bg-red-50 text-red-700 border-red-200">
                                {executionMetrics.blockedItems} blocked
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Utilization</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{executionMetrics.teamUtilization}%</div>
                        <Progress value={executionMetrics.teamUtilization} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            Capacity utilization
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                    <Button
                        type="button"
                        size="sm"
                        onClick={saveExecutionData}
                        disabled={isSaving}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Save className="h-3 w-3 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Execution Data'}
                    </Button>
                </div>

                {(isSaving || lastSaved) && (
                    <div className="text-sm text-muted-foreground">
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                <div className="h-3 w-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : lastSaved ? (
                            <span className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Planning vs Execution Tracking */}
            <Card>
                <CardHeader>
                    <CardTitle>Planning vs Execution Tracking</CardTitle>
                    <CardDescription>
                        Track planned vs actual values for all deliverables • Shows variance from original plan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="wbs" className="w-full">
                        <TabsList className="grid w-full grid-cols-7">
                            <TabsTrigger value="wbs">WBS</TabsTrigger>
                            <TabsTrigger value="cost">Cost</TabsTrigger>
                            <TabsTrigger value="risk">Risk</TabsTrigger>
                            <TabsTrigger value="communication">Communication</TabsTrigger>
                            <TabsTrigger value="quality">Quality</TabsTrigger>
                            <TabsTrigger value="resource">Resource</TabsTrigger>
                            <TabsTrigger value="procurement">Procurement</TabsTrigger>
                        </TabsList>

                        {/* WBS Execution Tracking */}
                        <TabsContent value="wbs" className="mt-6">
                            <WBSExecution
                                planningData={planningData}
                                executionData={executionData}
                                onUpdate={(taskId, field, value) => updateExecutionItem('1', taskId, field, value)}
                            />
                        </TabsContent>

                        {/* Cost Execution Tracking */}
                        <TabsContent value="cost" className="mt-6">
                            <CostExecution
                                planningData={planningData}
                                executionData={executionData}
                                onUpdate={(costId, field, value) => updateExecutionItem('2', costId, field, value)}
                            />
                        </TabsContent>

                        {/* Risk Execution Tracking */}
                        <TabsContent value="risk" className="mt-6">
                            <RiskExecution
                                planningData={planningData}
                                executionData={executionData}
                                onUpdate={(riskId, field, value) => updateExecutionItem('3', riskId, field, value)}
                            />
                        </TabsContent>

                        {/* Communication Execution Tracking */}
                        <TabsContent value="communication" className="mt-6">
                            <CommunicationExecution
                                planningData={planningData}
                                executionData={executionData}
                                onUpdate={(commId, field, value) => updateExecutionItem('4', commId, field, value)}
                            />
                        </TabsContent>

                        {/* Quality Execution Tracking */}
                        <TabsContent value="quality" className="mt-6">
                            <QualityExecution
                                planningData={planningData}
                                executionData={executionData}
                                onUpdate={(qualityId, field, value) => updateExecutionItem('5', qualityId, field, value)}
                            />
                        </TabsContent>

                        {/* Resource Execution Tracking */}
                        <TabsContent value="resource" className="mt-6">
                            <ResourceExecution
                                planningData={planningData}
                                executionData={executionData}
                                onUpdate={(resourceId, field, value) => updateExecutionItem('6', resourceId, field, value)}
                            />
                        </TabsContent>

                        {/* Procurement Execution Tracking */}
                        <TabsContent value="procurement" className="mt-6">
                            <ProcurementExecution
                                planningData={planningData}
                                executionData={executionData}
                                onUpdate={(procurementId, field, value) => updateExecutionItem('7', procurementId, field, value)}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Existing Execution Content */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Current Sprint Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Deliverables Status
                        </CardTitle>
                        <CardDescription>
                            Overall project deliverables completion
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-sm text-muted-foreground">{completionRate}%</span>
                            </div>
                            <Progress value={completionRate} />

                            <div className="grid grid-cols-3 gap-4 pt-4">
                                <button
                                    onClick={() => {
                                        setSelectedCategory('pending')
                                        setDeliverablesDialogOpen(true)
                                    }}
                                    className="space-y-1 text-left hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
                                >
                                    <p className="text-xs text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {(planningData?.deliverables || []).filter((d: any) => d.status === 'pending').length}
                                    </p>
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('in-progress')
                                        setDeliverablesDialogOpen(true)
                                    }}
                                    className="space-y-1 text-left hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
                                >
                                    <p className="text-xs text-muted-foreground">In Progress</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {(planningData?.deliverables || []).filter((d: any) => d.status === 'in-progress').length}
                                    </p>
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('completed')
                                        setDeliverablesDialogOpen(true)
                                    }}
                                    className="space-y-1 text-left hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
                                >
                                    <p className="text-xs text-muted-foreground">Completed</p>
                                    <p className="text-2xl font-bold text-green-600">{executionMetrics.completedDeliverables}</p>
                                </button>
                            </div>

                            <div className="pt-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Total Deliverables</span>
                                    <span className="font-medium">{executionMetrics.totalDeliverables}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Total Tasks</span>
                                    <span className="font-medium">{executionMetrics.tasksTotal}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Project Status</span>
                                    <Badge variant="outline" className={
                                        completionRate >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                                            completionRate >= 50 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-orange-50 text-orange-700 border-orange-200'
                                    }>
                                        {completionRate >= 80 ? 'On Track' : completionRate >= 50 ? 'In Progress' : 'Starting'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Resource Allocation
                        </CardTitle>
                        <CardDescription>
                            Team member allocation and availability
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(planningData?.deliverableDetails?.['6']?.resourceItems || []).length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground text-sm">
                                    No resources added yet. Add resources in the Planning → Resource Management tab.
                                </div>
                            ) : (
                                (planningData?.deliverableDetails?.['6']?.resourceItems || []).map((resource: any, index: number) => {
                                    const execItem = (executionData?.['6']?.items || []).find((item: any) => item.id === resource.id)
                                    const actualAllocation = parseFloat(execItem?.actualAllocation?.replace('%', '') || resource.allocation?.replace('%', '') || '0')
                                    const actualStatus = execItem?.actualStatus || resource.status

                                    return (
                                        <div key={index} className="p-3 border rounded-lg space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium block">{resource.resourceName}</span>
                                                    <span className="text-xs text-muted-foreground">{resource.role}</span>
                                                </div>
                                                <Badge variant="outline" className={
                                                    actualStatus === 'Allocated' ? 'text-xs bg-green-50 text-green-700 border-green-200' :
                                                        actualStatus === 'Overallocated' ? 'text-xs bg-red-50 text-red-700 border-red-200' :
                                                            actualStatus === 'Unavailable' ? 'text-xs bg-gray-50 text-gray-700 border-gray-200' :
                                                                'text-xs bg-blue-50 text-blue-700 border-blue-200'
                                                }>
                                                    {actualStatus}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>{actualAllocation}% allocated</span>
                                                <Progress value={actualAllocation} className="w-24 h-2" />
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Task Status Summary
                        </CardTitle>
                        <CardDescription>
                            Breakdown by status from WBS
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(() => {
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

                                const tasksWithStatus = allTasks.map(task => {
                                    const execItem = wbsExecutionItems.find((item: any) => item.id === task.id)
                                    return {
                                        ...task,
                                        actualStatus: execItem?.actualStatus || task.status
                                    }
                                })

                                const statusCounts = {
                                    Done: tasksWithStatus.filter(t => t.actualStatus === 'Done').length,
                                    'In Progress': tasksWithStatus.filter(t => t.actualStatus === 'In Progress').length,
                                    Planned: tasksWithStatus.filter(t => t.actualStatus === 'Planned').length,
                                    Pending: tasksWithStatus.filter(t => t.actualStatus === 'Pending').length,
                                    Delayed: tasksWithStatus.filter(t => t.actualStatus === 'Delayed').length,
                                }

                                return Object.entries(statusCounts).map(([status, count], index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setSelectedCategory(status)
                                            setTasksDialogOpen(true)
                                        }}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer w-full"
                                    >
                                        <div className="flex items-center gap-3">
                                            {status === 'Done' && <CheckCircle className="h-5 w-5 text-green-600" />}
                                            {status === 'In Progress' && <Clock className="h-5 w-5 text-blue-600" />}
                                            {status === 'Planned' && <Target className="h-5 w-5 text-purple-600" />}
                                            {status === 'Pending' && <Activity className="h-5 w-5 text-gray-600" />}
                                            {status === 'Delayed' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                                            <span className="font-medium text-sm">{status}</span>
                                        </div>
                                        <Badge variant="outline" className={
                                            status === 'Done' ? 'bg-green-50 text-green-700 border-green-200' :
                                                status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    status === 'Delayed' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                        }>
                                            {count} {count === 1 ? 'task' : 'tasks'}
                                        </Badge>
                                    </button>
                                ))
                            })()}
                            {(planningData?.deliverableDetails?.['1']?.wbsTasks || []).length === 0 && (
                                <div className="text-center p-8 text-muted-foreground text-sm">
                                    No tasks added yet. Add tasks in the Planning → WBS tab.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Blockers & Issues */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            Active Risks
                        </CardTitle>
                        <CardDescription>
                            Risks requiring immediate attention
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(() => {
                                const risks = planningData?.deliverableDetails?.['3']?.riskItems || []
                                const riskExecutionItems = executionData?.['3']?.items || []

                                const activeRisks = risks.filter((risk: any) => {
                                    const execItem = riskExecutionItems.find((item: any) => item.id === risk.id)
                                    const actualStatus = execItem?.actualStatus || risk.status
                                    return actualStatus === 'Active' && (risk.severity === 'Critical' || risk.severity === 'Major')
                                }).slice(0, 3) // Show top 3

                                if (activeRisks.length === 0) {
                                    return (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                                            <p className="text-sm">No critical active risks</p>
                                        </div>
                                    )
                                }

                                return activeRisks.map((risk: any, index: number) => {
                                    const execItem = riskExecutionItems.find((item: any) => item.id === risk.id)
                                    return (
                                        <div
                                            key={index}
                                            className={`p-3 border-l-4 rounded-lg ${risk.severity === 'Critical'
                                                ? 'border-l-red-500 bg-red-50'
                                                : 'border-l-orange-500 bg-orange-50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-sm">{risk.riskId}</span>
                                                        <Badge variant="outline" className={
                                                            risk.severity === 'Critical'
                                                                ? 'bg-red-100 text-red-700 border-red-200 text-xs'
                                                                : 'bg-orange-100 text-orange-700 border-orange-200 text-xs'
                                                        }>
                                                            {risk.severity}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-2">
                                                        {risk.description}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>Impact: {risk.impact}</span>
                                                        <span>Probability: {risk.probability}</span>
                                                        {execItem?.mitigationProgress && (
                                                            <span>Mitigation: {execItem.mitigationProgress}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Owner: {risk.owner}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            })()}
                            {(planningData?.deliverableDetails?.['3']?.riskItems || []).length === 0 && (
                                <div className="text-center p-8 text-muted-foreground text-sm">
                                    No risks added yet. Add risks in the Planning → Risk Management tab.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Deliverables Details Dialog */}
            <Dialog open={deliverablesDialogOpen} onOpenChange={setDeliverablesDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCategory === 'pending' && '⏳ Pending Deliverables'}
                            {selectedCategory === 'in-progress' && '🔄 In Progress Deliverables'}
                            {selectedCategory === 'completed' && '✅ Completed Deliverables'}
                        </DialogTitle>
                        <DialogDescription>
                            Showing all deliverables with status: <strong>{selectedCategory}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {(planningData?.deliverables || [])
                            .filter((d: any) => d.status === selectedCategory)
                            .map((deliverable: any, index: number) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium mb-1">{deliverable.item}</h4>
                                            <Badge variant="outline" className={
                                                deliverable.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    deliverable.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-orange-50 text-orange-700 border-orange-200'
                                            }>
                                                {deliverable.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        {(planningData?.deliverables || []).filter((d: any) => d.status === selectedCategory).length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No deliverables with this status
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Tasks Details Dialog */}
            <Dialog open={tasksDialogOpen} onOpenChange={setTasksDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCategory === 'Done' && '✅ Completed Tasks'}
                            {selectedCategory === 'In Progress' && '🔄 In Progress Tasks'}
                            {selectedCategory === 'Planned' && '📋 Planned Tasks'}
                            {selectedCategory === 'Pending' && '⏳ Pending Tasks'}
                            {selectedCategory === 'Delayed' && '⚠️ Delayed Tasks'}
                        </DialogTitle>
                        <DialogDescription>
                            Showing all tasks with status: <strong>{selectedCategory}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {(() => {
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

                            const filteredTasks = allTasks.filter(task => {
                                const execItem = wbsExecutionItems.find((item: any) => item.id === task.id)
                                const actualStatus = execItem?.actualStatus || task.status
                                return actualStatus === selectedCategory
                            })

                            if (filteredTasks.length === 0) {
                                return (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No tasks with this status
                                    </div>
                                )
                            }

                            return filteredTasks.map((task: any, index: number) => {
                                const execItem = wbsExecutionItems.find((item: any) => item.id === task.id)
                                return (
                                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium">{task.milestone || task.task}</h4>
                                                    <Badge variant="outline" className={
                                                        selectedCategory === 'Done' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            selectedCategory === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                selectedCategory === 'Delayed' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                                    }>
                                                        {selectedCategory}
                                                    </Badge>
                                                </div>
                                                {task.subtask && (
                                                    <p className="text-sm text-muted-foreground mb-2">{task.subtask}</p>
                                                )}
                                                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                                    <div>
                                                        <span className="font-medium">Assigned to:</span> {task.assignedTo || 'Unassigned'}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Planned:</span> {task.start} → {task.end}
                                                    </div>
                                                    {execItem?.actualStart && (
                                                        <div>
                                                            <span className="font-medium">Actual Start:</span> {execItem.actualStart}
                                                        </div>
                                                    )}
                                                    {execItem?.actualEnd && (
                                                        <div>
                                                            <span className="font-medium">Actual End:</span> {execItem.actualEnd}
                                                        </div>
                                                    )}
                                                    {task.dependency && (
                                                        <div className="col-span-2">
                                                            <span className="font-medium">Dependencies:</span> {task.dependency}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
