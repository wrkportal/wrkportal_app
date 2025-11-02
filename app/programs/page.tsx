'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/common/status-badge"
import { mockPrograms, mockUsers } from "@/lib/mock-data"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Plus, TrendingUp } from "lucide-react"
import { ProgramDialog } from "@/components/dialogs/program-dialog"

export default function ProgramsPage() {
    const router = useRouter()
    const [programDialogOpen, setProgramDialogOpen] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Programs</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage strategic programs and initiatives
                    </p>
                </div>
                <Button onClick={() => setProgramDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Program
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockPrograms.map((program) => {
                    const owner = mockUsers.find(u => u.id === program.ownerId)
                    const budgetSpentPercent = (program.budget.spentToDate / program.budget.totalBudget) * 100

                    return (
                        <Card
                            key={program.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => router.push(`/programs/${program.id}`)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-base">{program.name}</CardTitle>
                                        <CardDescription className="text-xs">{program.description}</CardDescription>
                                    </div>
                                    <StatusBadge status={program.status} />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Budget</span>
                                        <span className="font-medium">{Math.round(budgetSpentPercent)}%</span>
                                    </div>
                                    <Progress value={budgetSpentPercent} className="h-1.5" />
                                    <div className="text-[10px] text-muted-foreground">
                                        {formatCurrency(program.budget.spentToDate)} / {formatCurrency(program.budget.totalBudget)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Timeline</span>
                                    <span className="font-medium">
                                        {formatDate(program.startDate)} - {formatDate(program.endDate)}
                                    </span>
                                </div>

                                {owner && (
                                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                                        <span className="text-muted-foreground">Owner</span>
                                        <span className="font-medium">
                                            {owner.firstName} {owner.lastName}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {mockPrograms.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-64">
                        <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No programs found</p>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Program
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Program Dialog */}
            <ProgramDialog
                open={programDialogOpen}
                onClose={() => setProgramDialogOpen(false)}
                onSubmit={(data) => {
                    console.log('Program created:', data)
                    alert('✅ Program created successfully!')
                    setProgramDialogOpen(false)
                }}
            />
        </div>
    )
}

