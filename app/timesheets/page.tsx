'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockTimesheets, mockProjects } from "@/lib/mock-data"
import { useAuthStore } from "@/stores/authStore"
import { formatDate } from "@/lib/utils"
import { Plus, Clock, Check, X } from "lucide-react"
import { TimesheetDialog } from "@/components/dialogs/timesheet-dialog"

export default function TimesheetsPage() {
    const user = useAuthStore((state) => state.user)
    const [currentWeek] = useState(new Date())
    const [newTimesheetOpen, setNewTimesheetOpen] = useState(false)

    if (!user) return null

    const myTimesheets = mockTimesheets.filter(ts => ts.userId === user.id)

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            DRAFT: "secondary",
            SUBMITTED: "default",
            APPROVED: "outline",
            REJECTED: "destructive",
        }
        return <Badge variant={variants[status] || "default"}>{status}</Badge>
    }

    const getProject = (projectId: string) => {
        return mockProjects.find(p => p.id === projectId)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
                    <p className="text-muted-foreground">
                        Track and submit your time entries
                    </p>
                </div>
                <Button onClick={() => setNewTimesheetOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Timesheet
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Week</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24h</div>
                        <p className="text-xs text-muted-foreground">Logged time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Billable</CardTitle>
                        <Check className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">22h</div>
                        <p className="text-xs text-muted-foreground">91.7% billable</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">1</div>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">96h</div>
                        <p className="text-xs text-muted-foreground">Total logged</p>
                    </CardContent>
                </Card>
            </div>

            {/* Current Week Timesheet */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Current Week Timesheet</CardTitle>
                            <CardDescription>
                                Week of {formatDate(currentWeek)}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline">Save Draft</Button>
                            <Button>Submit for Approval</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project</TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Mon</TableHead>
                                <TableHead>Tue</TableHead>
                                <TableHead>Wed</TableHead>
                                <TableHead>Thu</TableHead>
                                <TableHead>Fri</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Project 1 - Parent Task */}
                            <TableRow className="bg-slate-50">
                                <TableCell className="font-semibold">CDR-001</TableCell>
                                <TableCell className="text-sm font-medium">Navigation</TableCell>
                                <TableCell className="font-medium">8h</TableCell>
                                <TableCell className="font-medium">8h</TableCell>
                                <TableCell className="font-medium">6h</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="font-bold">22h</TableCell>
                            </TableRow>
                            {/* Subtasks */}
                            <TableRow className="border-l-4 border-l-purple-200">
                                <TableCell className="pl-8 text-xs text-muted-foreground">└─</TableCell>
                                <TableCell className="text-sm text-muted-foreground">Header Component</TableCell>
                                <TableCell className="text-sm">4h</TableCell>
                                <TableCell className="text-sm">4h</TableCell>
                                <TableCell className="text-sm">2h</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="font-medium text-sm">10h</TableCell>
                            </TableRow>
                            <TableRow className="border-l-4 border-l-purple-200">
                                <TableCell className="pl-8 text-xs text-muted-foreground">└─</TableCell>
                                <TableCell className="text-sm text-muted-foreground">Sidebar Implementation</TableCell>
                                <TableCell className="text-sm">4h</TableCell>
                                <TableCell className="text-sm">4h</TableCell>
                                <TableCell className="text-sm">4h</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="font-medium text-sm">12h</TableCell>
                            </TableRow>

                            {/* Project 2 - Parent Task */}
                            <TableRow className="bg-slate-50">
                                <TableCell className="font-semibold">Internal</TableCell>
                                <TableCell className="text-sm font-medium">Team Meeting</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="font-medium">2h</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="font-bold">2h</TableCell>
                            </TableRow>
                            {/* Subtasks */}
                            <TableRow className="border-l-4 border-l-purple-200">
                                <TableCell className="pl-8 text-xs text-muted-foreground">└─</TableCell>
                                <TableCell className="text-sm text-muted-foreground">Sprint Planning</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="text-sm">1h</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="font-medium text-sm">1h</TableCell>
                            </TableRow>
                            <TableRow className="border-l-4 border-l-purple-200">
                                <TableCell className="pl-8 text-xs text-muted-foreground">└─</TableCell>
                                <TableCell className="text-sm text-muted-foreground">Retrospective</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="text-sm">1h</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="font-medium text-sm">1h</TableCell>
                            </TableRow>
                            <TableRow className="font-bold">
                                <TableCell colSpan={2}>Total</TableCell>
                                <TableCell>8h</TableCell>
                                <TableCell>8h</TableCell>
                                <TableCell>6h</TableCell>
                                <TableCell>2h</TableCell>
                                <TableCell>0h</TableCell>
                                <TableCell>24h</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    <div className="mt-4 flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Row
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Timesheets */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Timesheets</CardTitle>
                    <CardDescription>Your submitted timesheets</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {myTimesheets.map((timesheet) => (
                            <div key={timesheet.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">
                                            Week of {formatDate(timesheet.weekStartDate)}
                                        </p>
                                        {getStatusBadge(timesheet.status)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {timesheet.totalHours}h total •
                                        {timesheet.entries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0)}h billable
                                    </p>
                                    {timesheet.submittedAt && (
                                        <p className="text-xs text-muted-foreground">
                                            Submitted {formatDate(timesheet.submittedAt)}
                                        </p>
                                    )}
                                </div>
                                <Button variant="outline" size="sm">View Details</Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Timesheet Dialog */}
            <TimesheetDialog
                open={newTimesheetOpen}
                onClose={() => setNewTimesheetOpen(false)}
                onSubmit={(data) => {
                    console.log('Timesheet created:', data)
                    alert('✅ Timesheet created successfully!')
                    setNewTimesheetOpen(false)
                }}
            />
        </div>
    )
}

