'use client'

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatPercentage, formatDate } from "@/lib/utils"
import {
    Plus,
    Target,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    Users,
    Building2,
    User,
    Activity,
    Trash2
} from "lucide-react"
import { GoalDialog } from "@/components/dialogs/goal-dialog"
import { KRUpdateDialog } from "@/components/dialogs/kr-update-dialog"
import { cn } from "@/lib/utils"

export default function OKRsPage() {
    const [goalDialogOpen, setGoalDialogOpen] = useState(false)
    const [krUpdateDialogOpen, setKRUpdateDialogOpen] = useState(false)
    const [selectedKR, setSelectedKR] = useState<any>(null)
    const [selectedGoal, setSelectedGoal] = useState<any>(null)
    const [goals, setGoals] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [levelFilter, setLevelFilter] = useState<string>("ALL")
    const [quarterFilter, setQuarterFilter] = useState<string>("ALL")
    const [viewMode, setViewMode] = useState<"grid" | "list">("list")

    // Fetch goals
    const fetchGoals = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/okrs')
            if (response.ok) {
                const data = await response.json()
                setGoals(data.goals || [])
            }
        } catch (error) {
            console.error('Error fetching goals:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchGoals()
    }, [])

    const handleCreateGoal = async (data: any) => {
        try {
            const response = await fetch('/api/okrs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                alert('✅ Goal created successfully!')
                setGoalDialogOpen(false)
                fetchGoals()
            } else {
                const error = await response.json()
                alert(`Error: ${error.error || 'Failed to create goal'}`)
            }
        } catch (error) {
            console.error('Error creating goal:', error)
            alert('Failed to create goal. Please try again.')
        }
    }

    const handleUpdateProgress = (goalId: string, krId: string) => {
        const goal = goals.find(g => g.id === goalId)
        if (goal) {
            const kr = goal.keyResults.find((k: any) => k.id === krId)
            if (kr) {
                setSelectedKR(kr)
                setSelectedGoal(goal)
                setKRUpdateDialogOpen(true)
            }
        }
    }

    const handleKRUpdate = async (krId: string, goalId: string, data: any) => {
        try {
            const response = await fetch(`/api/okrs/${goalId}/key-results/${krId}/check-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                alert('✅ Progress updated successfully!')
                setKRUpdateDialogOpen(false)
                fetchGoals()
            } else {
                const error = await response.json()
                alert(`Error: ${error.error || 'Failed to update progress'}`)
            }
        } catch (error) {
            console.error('Error updating progress:', error)
            alert('Failed to update progress. Please try again.')
        }
    }

    const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
        if (!confirm(`Are you sure you want to delete "${goalTitle}"? This action cannot be undone.`)) {
            return
        }

        try {
            const response = await fetch(`/api/okrs/${goalId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                fetchGoals()
                alert('Goal deleted successfully!')
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete goal. Please try again.')
            }
        } catch (error) {
            console.error('Error deleting goal:', error)
            alert('Failed to delete goal. Please try again.')
        }
    }

    // Calculate goal health
    const getGoalHealth = (goal: any) => {
        if (goal.keyResults.length === 0) return 'unknown'

        const avgProgress = goal.keyResults.reduce((sum: number, kr: any) => {
            const progress = ((Number(kr.currentValue) - Number(kr.startValue)) / (Number(kr.targetValue) - Number(kr.startValue))) * 100
            return sum + Math.max(0, Math.min(progress, 100))
        }, 0) / goal.keyResults.length

        const avgConfidence = goal.keyResults.reduce((sum: number, kr: any) => sum + kr.confidence, 0) / goal.keyResults.length

        if (avgProgress >= 70 && avgConfidence >= 7) return 'on-track'
        if (avgProgress >= 40 && avgConfidence >= 4) return 'at-risk'
        return 'off-track'
    }

    // Filter and search goals
    const filteredGoals = useMemo(() => {
        return goals.filter(goal => {
            // Search filter
            if (searchQuery && !goal.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }

            // Status filter
            if (statusFilter !== "ALL" && goal.status !== statusFilter) {
                return false
            }

            // Level filter
            if (levelFilter !== "ALL" && goal.level !== levelFilter) {
                return false
            }

            // Quarter filter
            if (quarterFilter !== "ALL") {
                const goalPeriod = `${goal.quarter} ${goal.year}`
                if (goalPeriod !== quarterFilter) {
                    return false
                }
            }

            return true
        })
    }, [goals, searchQuery, statusFilter, levelFilter, quarterFilter])

    // Calculate comprehensive metrics
    const metrics = useMemo(() => {
        const totalKeyResults = goals.reduce((sum, goal) => sum + goal.keyResults.length, 0)
        const activeGoals = goals.filter(g => g.status === 'ACTIVE').length
        const completedGoals = goals.filter(g => g.status === 'COMPLETED').length

        const healthStats = goals.reduce((acc, goal) => {
            const health = getGoalHealth(goal)
            acc[health] = (acc[health] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const avgConfidence = totalKeyResults > 0
            ? goals.reduce((sum, goal) =>
                sum + goal.keyResults.reduce((s: number, kr: any) => s + kr.confidence, 0), 0) / totalKeyResults
            : 0

        const avgProgress = totalKeyResults > 0
            ? goals.reduce((sum, goal) => {
                return sum + goal.keyResults.reduce((s: number, kr: any) => {
                    const progress = ((Number(kr.currentValue) - Number(kr.startValue)) / (Number(kr.targetValue) - Number(kr.startValue))) * 100
                    return s + Math.max(0, Math.min(progress, 100))
                }, 0)
            }, 0) / totalKeyResults
            : 0

        // Group by level
        const byLevel = goals.reduce((acc, goal) => {
            acc[goal.level] = (acc[goal.level] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return {
            totalGoals: goals.length,
            activeGoals,
            completedGoals,
            totalKeyResults,
            avgConfidence,
            avgProgress,
            onTrack: healthStats['on-track'] || 0,
            atRisk: healthStats['at-risk'] || 0,
            offTrack: healthStats['off-track'] || 0,
            byLevel,
        }
    }, [goals])

    // Get unique quarters for filter
    const quarters = useMemo(() => {
        const uniqueQuarters = new Set(goals.map(g => `${g.quarter} ${g.year}`))
        return Array.from(uniqueQuarters).sort().reverse()
    }, [goals])

    // Get current quarter
    const currentQuarter = `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header - Sticky */}
            <div className="sticky top-0 md:top-12 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 md:pt-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Goals & OKRs
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Track objectives and key results across the organization
                        </p>
                    </div>
                    <Button onClick={() => setGoalDialogOpen(true)} size="lg" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        New Goal
                    </Button>
                </div>
            </div>

            {/* Quick Stats Dashboard */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-medium">Total Goals</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalGoals}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{metrics.activeGoals} Active</Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{metrics.completedGoals} Done</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-medium">Health Status</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{metrics.onTrack}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-yellow-600">⚠️ {metrics.atRisk} At Risk</span>
                            <span className="text-red-600">🔴 {metrics.offTrack} Off Track</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-medium">Avg Progress</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.avgProgress.toFixed(1)}%</div>
                        <Progress value={metrics.avgProgress} className="h-2 mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-medium">Avg Confidence</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.avgConfidence.toFixed(1)}/10</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across {metrics.totalKeyResults} Key Results
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search goals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={levelFilter} onValueChange={setLevelFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Levels</SelectItem>
                                <SelectItem value="COMPANY">Company</SelectItem>
                                <SelectItem value="DEPARTMENT">Department</SelectItem>
                                <SelectItem value="TEAM">Team</SelectItem>
                                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={quarterFilter} onValueChange={setQuarterFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Quarter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Quarters</SelectItem>
                                {quarters.map(q => (
                                    <SelectItem key={q} value={q}>{q}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for different views */}
            <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                    <TabsTrigger value="all" className="text-xs md:text-sm">
                        All Goals ({filteredGoals.length})
                    </TabsTrigger>
                    <TabsTrigger value="company" className="text-xs md:text-sm gap-1">
                        <Building2 className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Company</span>
                        <span className="sm:hidden">Co.</span> ({filteredGoals.filter(g => g.level === 'COMPANY').length})
                    </TabsTrigger>
                    <TabsTrigger value="department" className="text-xs md:text-sm gap-1">
                        <Users className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Department</span>
                        <span className="sm:hidden">Dept.</span> ({filteredGoals.filter(g => g.level === 'DEPARTMENT').length})
                    </TabsTrigger>
                    <TabsTrigger value="team" className="text-xs md:text-sm gap-1">
                        <Users className="h-3 w-3 md:h-4 md:w-4" />
                        Team ({filteredGoals.filter(g => g.level === 'TEAM').length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <GoalsList
                        goals={filteredGoals}
                        onUpdateProgress={handleUpdateProgress}
                        onDeleteGoal={handleDeleteGoal}
                        getGoalHealth={getGoalHealth}
                    />
                </TabsContent>

                <TabsContent value="company" className="space-y-4">
                    <GoalsList
                        goals={filteredGoals.filter(g => g.level === 'COMPANY')}
                        onUpdateProgress={handleUpdateProgress}
                        onDeleteGoal={handleDeleteGoal}
                        getGoalHealth={getGoalHealth}
                    />
                </TabsContent>

                <TabsContent value="department" className="space-y-4">
                    <GoalsList
                        goals={filteredGoals.filter(g => g.level === 'DEPARTMENT')}
                        onUpdateProgress={handleUpdateProgress}
                        onDeleteGoal={handleDeleteGoal}
                        getGoalHealth={getGoalHealth}
                    />
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                    <GoalsList
                        goals={filteredGoals.filter(g => g.level === 'TEAM')}
                        onUpdateProgress={handleUpdateProgress}
                        onDeleteGoal={handleDeleteGoal}
                        getGoalHealth={getGoalHealth}
                    />
                </TabsContent>
            </Tabs>

            {filteredGoals.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-64">
                        <Target className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            {goals.length === 0 ? "No goals defined yet" : "No goals match your filters"}
                        </p>
                        {goals.length === 0 && (
                            <Button onClick={() => setGoalDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Your First Goal
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Goal Dialog */}
            <GoalDialog
                open={goalDialogOpen}
                onClose={() => setGoalDialogOpen(false)}
                onSubmit={handleCreateGoal}
            />

            {/* KR Update Dialog */}
            <KRUpdateDialog
                open={krUpdateDialogOpen}
                onClose={() => setKRUpdateDialogOpen(false)}
                keyResult={selectedKR}
                onSubmit={(data) => handleKRUpdate(selectedKR?.id, selectedGoal?.id, data)}
            />
        </div>
    )
}

// Goals List Component
function GoalsList({
    goals,
    onUpdateProgress,
    onDeleteGoal,
    getGoalHealth
}: {
    goals: any[],
    onUpdateProgress: (goalId: string, krId: string) => void,
    onDeleteGoal: (goalId: string, goalTitle: string) => void,
    getGoalHealth: (goal: any) => string
}) {
    const getHealthIcon = (health: string) => {
        switch (health) {
            case 'on-track':
                return <CheckCircle2 className="h-5 w-5 text-green-600" />
            case 'at-risk':
                return <AlertCircle className="h-5 w-5 text-yellow-600" />
            case 'off-track':
                return <TrendingDown className="h-5 w-5 text-red-600" />
            default:
                return <Clock className="h-5 w-5 text-gray-400" />
        }
    }

    const getHealthBadge = (health: string) => {
        switch (health) {
            case 'on-track':
                return <Badge className="bg-green-100 text-green-800 border-green-300">On Track</Badge>
            case 'at-risk':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">At Risk</Badge>
            case 'off-track':
                return <Badge className="bg-red-100 text-red-800 border-red-300">Off Track</Badge>
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    return (
        <div className="space-y-4">
            {goals.map((goal) => {
                const health = getGoalHealth(goal)
                const avgProgress = goal.keyResults.length > 0
                    ? goal.keyResults.reduce((sum: number, kr: any) => {
                        const progress = ((Number(kr.currentValue) - Number(kr.startValue)) / (Number(kr.targetValue) - Number(kr.startValue))) * 100
                        return sum + Math.max(0, Math.min(progress, 100))
                    }, 0) / goal.keyResults.length
                    : 0

                return (
                    <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn(
                                                "h-2 w-2 rounded-full shrink-0",
                                                health === 'on-track' && "bg-green-500",
                                                health === 'at-risk' && "bg-yellow-500",
                                                health === 'off-track' && "bg-red-500",
                                                health === 'unknown' && "bg-gray-400"
                                            )}
                                            title={health === 'on-track' ? 'On Track' : health === 'at-risk' ? 'At Risk' : health === 'off-track' ? 'Off Track' : 'Unknown'}
                                        />
                                        <CardTitle className="text-xl">{goal.title}</CardTitle>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-purple-600">
                                            {avgProgress.toFixed(0)}%
                                        </div>
                                        <p className="text-xs text-muted-foreground">Overall Progress</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDeleteGoal(goal.id, goal.title)
                                        }}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        title="Delete Goal"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {goal.description && (
                                <p className="text-sm text-muted-foreground">{goal.description}</p>
                            )}

                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Key Results ({goal.keyResults.length})
                                </h4>
                                {goal.keyResults.map((kr: any) => {
                                    const progress = ((Number(kr.currentValue) - Number(kr.startValue)) / (Number(kr.targetValue) - Number(kr.startValue))) * 100
                                    const clampedProgress = Math.max(0, Math.min(progress, 100))

                                    return (
                                        <div key={kr.id} className="space-y-2 rounded-lg border p-4 hover:bg-accent transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{kr.title}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            📊 Weight: {kr.weight}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-sm font-bold">
                                                        {Number(kr.currentValue).toLocaleString()} / {Number(kr.targetValue).toLocaleString()} {kr.unit}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Progress</span>
                                                    <span className="font-medium">{formatPercentage(clampedProgress)}</span>
                                                </div>
                                                <Progress
                                                    value={clampedProgress}
                                                    className={cn(
                                                        "h-2",
                                                        clampedProgress >= 70 && "bg-green-100",
                                                        clampedProgress < 70 && clampedProgress >= 40 && "bg-yellow-100",
                                                        clampedProgress < 40 && "bg-red-100"
                                                    )}
                                                />
                                            </div>

                                            {kr.checkIns && kr.checkIns.length > 0 && (
                                                <div className="pt-2 border-t">
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Last check-in: {formatDate(kr.checkIns[0].createdAt)}
                                                    </p>
                                                    {kr.checkIns[0].narrative && (
                                                        <p className="text-xs mt-1 italic text-slate-600">
                                                            &quot;{kr.checkIns[0].narrative}&quot;
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onUpdateProgress(goal.id, kr.id)}
                                                className="w-full"
                                            >
                                                Update Progress
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
