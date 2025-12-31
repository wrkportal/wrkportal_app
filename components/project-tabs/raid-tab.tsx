'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { formatDate } from "@/lib/utils"
import { Plus, AlertTriangle, XOctagon, Loader2 } from "lucide-react"
import { RAIDDialog } from "@/components/dialogs/raid-dialog"

interface RAIDTabProps {
    projectId: string
}

export function RAIDTab({ projectId }: RAIDTabProps) {
    const [raidDialogOpen, setRAIDDialogOpen] = useState(false)
    const [risks, setRisks] = useState<any[]>([])
    const [issues, setIssues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch risks and issues from database
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // Fetch risks
                const risksResponse = await fetch(`/api/projects/${projectId}/risks`)
                if (risksResponse.ok) {
                    const risksData = await risksResponse.json()
                    setRisks(risksData.risks || [])
                }

                // Fetch issues
                const issuesResponse = await fetch(`/api/projects/${projectId}/issues`)
                if (issuesResponse.ok) {
                    const issuesData = await issuesResponse.json()
                    setIssues(issuesData.issues || [])
                }
            } catch (error) {
                console.error('Error fetching RAID data:', error)
            } finally {
                setLoading(false)
            }
        }

        if (projectId) {
            fetchData()
        }
    }, [projectId])

    // Calculate stats
    const activeRisks = risks.filter(r => r.status !== 'CLOSED')
    const criticalRisks = risks.filter(r => r.level === 'CRITICAL' || r.level === 'HIGH')
    const openIssues = issues.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS')
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH')

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* RAID Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Risks</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{activeRisks.length}</div>
                        <p className="text-xs text-muted-foreground">Being monitored</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Risks</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{criticalRisks.length}</div>
                        <p className="text-xs text-muted-foreground">High/Critical level</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                        <XOctagon className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{openIssues.length}</div>
                        <p className="text-xs text-muted-foreground">Need resolution</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                        <XOctagon className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{criticalIssues.length}</div>
                        <p className="text-xs text-muted-foreground">Urgent attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Risks and Issues Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Risks */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Risks</CardTitle>
                                <CardDescription>{risks.length} identified risks</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setRAIDDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Risk
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {risks.map((risk) => (
                                <div key={risk.id} className="p-3 border rounded-lg space-y-2 hover:bg-accent transition-colors cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <h5 className="font-medium text-sm">{risk.title}</h5>
                                        <StatusBadge status={risk.level} />
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{risk.description}</p>
                                    <div className="flex items-center gap-4 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Impact:</span>
                                            <span className="ml-1 font-medium">{risk.impact}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Probability:</span>
                                            <span className="ml-1 font-medium">{risk.probability}</span>
                                        </div>
                                        {risk.score && (
                                            <div>
                                                <span className="text-muted-foreground">Score:</span>
                                                <span className="ml-1 font-medium">{risk.score}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={risk.status} />
                                        <span className="text-xs text-muted-foreground">
                                            Identified: {formatDate(risk.identifiedDate)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {risks.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No risks identified</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Issues */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Issues</CardTitle>
                                <CardDescription>{issues.length} active issues</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setRAIDDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Issue
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {issues.map((issue) => (
                                <div key={issue.id} className="p-3 border rounded-lg space-y-2 hover:bg-accent transition-colors cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <h5 className="font-medium text-sm">{issue.title}</h5>
                                        <StatusBadge status={issue.severity} />
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{issue.description}</p>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={issue.status} />
                                        <span className="text-xs text-muted-foreground">
                                            Reported: {formatDate(issue.reportedDate || issue.createdAt)}
                                        </span>
                                        {issue.resolvedDate && (
                                            <>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Resolved: {formatDate(issue.resolvedDate)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {issues.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <XOctagon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No issues reported</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RAID Dialog */}
            <RAIDDialog
                open={raidDialogOpen}
                onClose={() => setRAIDDialogOpen(false)}
                onSubmit={(data) => {
                    console.log('RAID item created:', data)
                    alert('✅ RAID item created successfully!')
                    setRAIDDialogOpen(false)
                }}
                projectId={projectId}
            />
        </div>
    )
}

