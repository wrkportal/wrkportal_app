'use client'

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/common/status-badge"
import { mockPortfolios, mockUsers } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"
import { Plus, Briefcase } from "lucide-react"

export default function PortfoliosPage() {
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Portfolios</h1>
                    <p className="text-muted-foreground">
                        Strategic portfolio management and oversight
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Portfolio
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {mockPortfolios.map((portfolio) => {
                    const owner = mockUsers.find(u => u.id === portfolio.ownerId)
                    const budgetSpentPercent = (portfolio.budget.spentToDate / portfolio.budget.totalBudget) * 100

                    return (
                        <Card
                            key={portfolio.id}
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => router.push(`/portfolios/${portfolio.id}`)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl">{portfolio.name}</CardTitle>
                                        <CardDescription>{portfolio.description}</CardDescription>
                                    </div>
                                    <StatusBadge status={portfolio.status} />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Budget</p>
                                        <p className="text-2xl font-bold">{formatCurrency(portfolio.budget.totalBudget)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Spent</p>
                                        <p className="text-2xl font-bold">{formatCurrency(portfolio.budget.spentToDate)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Budget Utilization</span>
                                        <span className="font-medium">{Math.round(budgetSpentPercent)}%</span>
                                    </div>
                                    <Progress value={budgetSpentPercent} className="h-2" />
                                </div>

                                <div className="space-y-2 pt-2 border-t">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Strategic Goals</span>
                                        <span className="font-medium">{portfolio.strategicGoals.length}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {portfolio.strategicGoals.slice(0, 2).map((goal, idx) => (
                                            <span key={idx} className="text-xs bg-secondary px-2 py-1 rounded">
                                                {goal}
                                            </span>
                                        ))}
                                        {portfolio.strategicGoals.length > 2 && (
                                            <span className="text-xs text-muted-foreground px-2 py-1">
                                                +{portfolio.strategicGoals.length - 2} more
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {owner && (
                                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                                        <span className="text-muted-foreground">Portfolio Owner</span>
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

            {mockPortfolios.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-64">
                        <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No portfolios found</p>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Portfolio
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

