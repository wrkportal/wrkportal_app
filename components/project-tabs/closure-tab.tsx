'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
    CheckCircle,
    Circle,
    FileText,
    Award,
    TrendingUp,
    Users,
    Target,
    Archive,
    Clock
} from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'

interface ClosureTabProps {
    project: any
}

export function ClosureTab({ project }: ClosureTabProps) {
    const [planningData, setPlanningData] = useState<any>(null)
    const [executionData, setExecutionData] = useState<any>(null)
    const [initiateData, setInitiateData] = useState<any>(null)
    const [dataLoaded, setDataLoaded] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isClosing, setIsClosing] = useState(false)

    const [closureChecklist, setClosureChecklist] = useState([
        { id: 1, item: 'All deliverables completed and accepted', completed: false, autoChecked: true },
        { id: 2, item: 'Final project documentation archived', completed: false, autoChecked: false },
        { id: 3, item: 'Financial closure completed', completed: false, autoChecked: true },
        { id: 4, item: 'Lessons learned documented', completed: false, autoChecked: false },
        { id: 5, item: 'Team performance reviews completed', completed: false, autoChecked: false },
        { id: 6, item: 'Post-implementation review scheduled', completed: false, autoChecked: false },
        { id: 7, item: 'Resources released and reassigned', completed: false, autoChecked: false },
        { id: 8, item: 'Contract closure and vendor payments', completed: false, autoChecked: false },
    ])

    const [lessonsLearned, setLessonsLearned] = useState({
        whatWentWell: '',
        whatCouldBeImproved: '',
        recommendations: ''
    })

    // Load all project data
    useEffect(() => {
        if (project?.id) {
            loadClosureData()
        }
    }, [project?.id])

    const loadClosureData = async () => {
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

            // Load initiate data
            const initiateResponse = await fetch(`/api/projects/${project?.id}/initiate`)
            if (initiateResponse.ok) {
                const data = await initiateResponse.json()
                setInitiateData(data.initiateData || {})
            }

            // Load closure data
            const closureResponse = await fetch(`/api/projects/${project?.id}/closure`)
            if (closureResponse.ok) {
                const data = await closureResponse.json()
                if (data.closureData) {
                    if (data.closureData.checklist) {
                        setClosureChecklist(data.closureData.checklist)
                    }
                    if (data.closureData.lessonsLearned) {
                        setLessonsLearned(data.closureData.lessonsLearned)
                    }
                    if (data.closureData.lastUpdated) {
                        setLastSaved(new Date(data.closureData.lastUpdated))
                    }
                }
            }

            setDataLoaded(true)
        } catch (error) {
            console.error('Error loading closure data:', error)
            setDataLoaded(true)
        }
    }

    const saveClosureData = async () => {
        try {
            setIsSaving(true)

            const dataToSave = {
                checklist: closureChecklist,
                lessonsLearned
            }

            const response = await fetch(`/api/projects/${project?.id}/closure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave),
            })

            if (response.ok) {
                setLastSaved(new Date())
                console.log('✅ Closure data saved successfully')
            } else {
                console.error('❌ Failed to save closure data')
                alert('Failed to save closure data')
            }
        } catch (error) {
            console.error('❌ Error saving closure data:', error)
            alert('Error saving closure data')
        } finally {
            setIsSaving(false)
        }
    }

    const toggleChecklistItem = (itemId: number) => {
        setClosureChecklist(closureChecklist.map(item => {
            if (item.id === itemId && !item.autoChecked) {
                return { ...item, completed: !item.completed }
            }
            return item
        }))
    }

    const sendForClosureApproval = async () => {
        if (confirm('Are you sure you want to send this project for closure approval? The project will be reviewed and then closed.')) {
            try {
                setIsClosing(true)

                // Save current closure data first
                await saveClosureData()

                // Create approval request
                const response = await fetch('/api/approvals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'PROJECT_CLOSURE',
                        relatedId: project.id,
                        title: `Project Closure: ${project.name}`,
                        description: `Requesting approval to close project "${project.name}". All deliverables completed and closure activities finalized.`,
                        documentData: {
                            closureChecklist,
                            lessonsLearned,
                            projectId: project.id,
                            projectName: project.name
                        },
                        approvers: [], // Will need to select approvers
                        ccList: []
                    }),
                })

                if (response.ok) {
                    alert('Project closure request sent for approval successfully!')
                    loadClosureData() // Reload to get updated status
                } else {
                    const error = await response.json()
                    alert(`Failed to send closure request: ${error.error}`)
                }
            } catch (error) {
                console.error('Error sending closure request:', error)
                alert('Error sending closure request')
            } finally {
                setIsClosing(false)
            }
        }
    }

    // Calculate closure metrics
    const calculateMetrics = () => {
        // Check deliverables completion
        const deliverables = planningData?.deliverables || []
        const completedDeliverables = deliverables.filter((d: any) => d.status === 'completed').length
        const allDeliverablesComplete = deliverables.length > 0 && completedDeliverables === deliverables.length

        // Check financial closure (all costs have actuals)
        const costItems = planningData?.deliverableDetails?.['2']?.costItems || []
        const costExecutionItems = executionData?.['2']?.items || []
        const financialClosure = costItems.length > 0 && costItems.every((cost: any) => {
            const execItem = costExecutionItems.find((item: any) => item.id === cost.id)
            return execItem?.actualCost
        })

        // Update auto-checked items in checklist
        const updatedChecklist = closureChecklist.map(item => {
            if (item.id === 1 && item.autoChecked) {
                return { ...item, completed: allDeliverablesComplete }
            }
            if (item.id === 3 && item.autoChecked) {
                return { ...item, completed: financialClosure }
            }
            return item
        })

        // Calculate budget metrics
        let totalEstimated = 0
        let totalActual = 0
        costItems.forEach((cost: any) => {
            const execItem = costExecutionItems.find((item: any) => item.id === cost.id)
            totalEstimated += parseFloat(cost.estimatedCost) || 0
            totalActual += parseFloat(execItem?.actualCost || '0')
        })
        const budgetVariance = totalEstimated > 0 ? ((totalEstimated - totalActual) / totalEstimated) * 100 : 0

        // Calculate duration
        let durationDays = 0
        let plannedDays = 0
        let scheduleVariance = 0
        if (project?.startDate && project?.endDate) {
            try {
                const startDate = parseISO(project.startDate)
                const endDate = parseISO(project.endDate)
                const today = new Date()
                durationDays = differenceInDays(today, startDate)
                plannedDays = differenceInDays(endDate, startDate)
                scheduleVariance = ((durationDays - plannedDays) / plannedDays) * 100
            } catch (e) {
                console.error('Error calculating duration:', e)
            }
        }

        // Calculate success score from objectives
        const objectives = initiateData?.objectives?.successCriteria || []
        let successScore = 0
        if (objectives.length > 0) {
            let totalAchievement = 0
            objectives.forEach((metric: any) => {
                const target = parseFloat(metric.targetValue) || 100
                const current = parseFloat(metric.currentValue) || 0
                const achievement = Math.min(100, (current / target) * 100)
                totalAchievement += achievement
            })
            successScore = Math.round(totalAchievement / objectives.length)
        } else {
            // Default based on deliverables completion
            successScore = deliverables.length > 0 ? Math.round((completedDeliverables / deliverables.length) * 100) : 0
        }

        const completedItems = updatedChecklist.filter(item => item.completed).length
        const closureProgress = Math.round((completedItems / updatedChecklist.length) * 100)

        return {
            closureProgress,
            completedItems,
            totalItems: updatedChecklist.length,
            totalEstimated,
            totalActual,
            budgetVariance,
            durationDays,
            plannedDays,
            scheduleVariance,
            successScore,
            allDeliverablesComplete,
            completedDeliverables,
            totalDeliverables: deliverables.length,
            updatedChecklist
        }
    }

    const metrics = calculateMetrics()
    const completedItems = metrics.completedItems
    const closureProgress = metrics.closureProgress

    return (
        <div className="space-y-6">
            {/* Closure Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Closure Progress</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{closureProgress}%</div>
                        <Progress value={closureProgress} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {completedItems} of {metrics.totalItems} activities
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Final Budget</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics.totalActual > 0 ? `₹${metrics.totalActual.toFixed(0)}` : 'N/A'}
                        </div>
                        {metrics.totalEstimated > 0 && (
                            <>
                                <Badge variant="outline" className={`mt-2 ${metrics.budgetVariance >= 0
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                    {Math.abs(metrics.budgetVariance).toFixed(1)}% {metrics.budgetVariance >= 0 ? 'under' : 'over'} budget
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Planned: ₹{metrics.totalEstimated.toFixed(0)}
                                </p>
                            </>
                        )}
                        {metrics.totalEstimated === 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                No budget data available
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics.durationDays > 0 ? `${metrics.durationDays} days` : 'N/A'}
                        </div>
                        {metrics.plannedDays > 0 && (
                            <>
                                <Badge variant="outline" className={`mt-2 ${metrics.scheduleVariance <= 0
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                                    }`}>
                                    {Math.abs(metrics.scheduleVariance).toFixed(1)}% {metrics.scheduleVariance <= 0 ? 'ahead of' : 'over'} schedule
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Planned: {metrics.plannedDays} days
                                </p>
                            </>
                        )}
                        {metrics.plannedDays === 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                No timeline data available
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Score</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.successScore}%</div>
                        <Badge variant="outline" className={`mt-2 ${metrics.successScore >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
                            metrics.successScore >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                            {metrics.successScore >= 90 ? 'Exceeded targets' : metrics.successScore >= 70 ? 'Met targets' : 'Partial success'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                            {metrics.completedDeliverables}/{metrics.totalDeliverables} deliverables completed
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Closure Checklist */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Closure Checklist
                        </CardTitle>
                        <CardDescription>
                            Complete all activities to formally close the project
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {metrics.updatedChecklist.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (!item.autoChecked) {
                                            toggleChecklistItem(item.id)
                                        }
                                    }}
                                    disabled={item.autoChecked}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors text-left ${item.autoChecked
                                            ? 'cursor-not-allowed opacity-60'
                                            : 'hover:bg-accent/50 cursor-pointer'
                                        }`}
                                    title={item.autoChecked ? 'This item is auto-checked based on project data' : 'Click to toggle completion'}
                                >
                                    {item.completed ? (
                                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className={item.completed ? 'text-muted-foreground line-through' : ''}>
                                        {item.item}
                                        {item.autoChecked && <span className="text-xs ml-2 text-blue-600">(Auto)</span>}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={saveClosureData} disabled={isSaving} size="sm">
                                {isSaving ? 'Saving...' : 'Save Checklist'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Project Outcomes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Project Outcomes
                        </CardTitle>
                        <CardDescription>
                            Achievement against original objectives
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {(() => {
                                const objectives = initiateData?.objectives?.successCriteria || []

                                if (objectives.length === 0) {
                                    return (
                                        <div className="text-center p-6 border rounded-lg bg-gray-50">
                                            <p className="text-sm text-muted-foreground">
                                                No success criteria defined yet.<br />
                                                Add success metrics in Initiate → Project Objectives tab
                                            </p>
                                        </div>
                                    )
                                }

                                return objectives.map((metric: any, index: number) => {
                                    const target = parseFloat(metric.targetValue) || 100
                                    const current = parseFloat(metric.currentValue) || 0
                                    const achievementPercent = Math.min(150, (current / target) * 100)

                                    return (
                                        <div key={index} className="p-3 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-sm">{metric.description}</span>
                                                <Badge variant="outline" className={
                                                    achievementPercent >= 100 ? 'bg-green-50 text-green-700 border-green-200' :
                                                        achievementPercent >= 80 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-orange-50 text-orange-700 border-orange-200'
                                                }>
                                                    {achievementPercent.toFixed(0)}% achieved
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                Target: {target}{metric.unit} • Achieved: {current}{metric.unit}
                                            </p>
                                            <Progress
                                                value={achievementPercent}
                                                className={
                                                    achievementPercent >= 100 ? 'bg-green-100' :
                                                        achievementPercent >= 80 ? 'bg-blue-100' :
                                                            'bg-orange-100'
                                                }
                                            />
                                        </div>
                                    )
                                })
                            })()}
                        </div>
                    </CardContent>
                </Card>

                {/* Lessons Learned */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Lessons Learned
                        </CardTitle>
                        <CardDescription>
                            Key insights for future projects
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-sm mb-2 text-green-700">What Went Well</h4>
                                <Textarea
                                    placeholder="Document successes and best practices..."
                                    rows={3}
                                    value={lessonsLearned.whatWentWell}
                                    onChange={(e) => setLessonsLearned({ ...lessonsLearned, whatWentWell: e.target.value })}
                                />
                            </div>

                            <div>
                                <h4 className="font-medium text-sm mb-2 text-orange-700">What Could Be Improved</h4>
                                <Textarea
                                    placeholder="Document challenges and improvement opportunities..."
                                    rows={3}
                                    value={lessonsLearned.whatCouldBeImproved}
                                    onChange={(e) => setLessonsLearned({ ...lessonsLearned, whatCouldBeImproved: e.target.value })}
                                />
                            </div>

                            <div>
                                <h4 className="font-medium text-sm mb-2 text-blue-700">Recommendations</h4>
                                <Textarea
                                    placeholder="Provide recommendations for future projects..."
                                    rows={3}
                                    value={lessonsLearned.recommendations}
                                    onChange={(e) => setLessonsLearned({ ...lessonsLearned, recommendations: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {lastSaved && (
                                    <span className="text-xs text-muted-foreground self-center">
                                        Last saved: {lastSaved.toLocaleTimeString()}
                                    </span>
                                )}
                                <Button onClick={saveClosureData} disabled={isSaving} size="sm">
                                    {isSaving ? 'Saving...' : 'Save Lessons Learned'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Recognition */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Recognition
                        </CardTitle>
                        <CardDescription>
                            Outstanding contributions and achievements
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(() => {
                                const resources = planningData?.deliverableDetails?.['6']?.resourceItems || []

                                if (resources.length === 0) {
                                    return (
                                        <div className="text-center p-6 border rounded-lg bg-gray-50">
                                            <p className="text-sm text-muted-foreground">
                                                No team members added yet.<br />
                                                Add resources in Planning → Resource Management tab
                                            </p>
                                        </div>
                                    )
                                }

                                const achievements = [
                                    { icon: '🏆', label: 'MVP - Exceptional contribution' },
                                    { icon: '🤝', label: 'Best Collaborator' },
                                    { icon: '💡', label: 'Innovation Award' },
                                    { icon: '⭐', label: 'Quality Champion' },
                                    { icon: '🎯', label: 'Outstanding Performance' },
                                    { icon: '🚀', label: 'Project Excellence' },
                                ]

                                return resources.map((resource: any, index: number) => {
                                    const achievement = achievements[index % achievements.length]
                                    return (
                                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
                                            <span className="text-2xl">{achievement.icon}</span>
                                            <div className="flex-1">
                                                <p className="font-medium">{resource.resourceName}</p>
                                                <p className="text-xs text-muted-foreground mb-1">{resource.role}</p>
                                                <p className="text-sm text-muted-foreground">{achievement.label}</p>
                                            </div>
                                        </div>
                                    )
                                })
                            })()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Final Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Project Closure Actions
                    </CardTitle>
                    <CardDescription>
                        Final steps to officially close the project
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium">Ready to close this project?</p>
                            <p className="text-sm text-muted-foreground">
                                This will send the project for closure approval. Once approved, the project will be archived and all resources will be released.
                            </p>
                            {closureProgress < 100 && (
                                <p className="text-xs text-orange-600 mt-1">
                                    ⚠️ Complete all checklist items before sending for closure approval ({closureProgress}% complete)
                                </p>
                            )}
                        </div>
                        <Button
                            onClick={sendForClosureApproval}
                            disabled={closureProgress < 100 || isClosing}
                        >
                            <Archive className="mr-2 h-4 w-4" />
                            {isClosing ? 'Sending...' : 'Send for Closure Approval'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

