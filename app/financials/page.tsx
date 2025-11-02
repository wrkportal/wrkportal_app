'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { mockProjects } from "@/lib/mock-data"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { Plus, DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"

export default function FinancialsPage() {
    const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget.totalBudget, 0)
    const totalSpent = mockProjects.reduce((sum, p) => sum + p.budget.spentToDate, 0)
    const totalCommitted = mockProjects.reduce((sum, p) => sum + p.budget.committed, 0)
    const totalVariance = mockProjects.reduce((sum, p) => sum + p.budget.variance, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
                    <p className="text-muted-foreground">
                        Budget management and financial tracking
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Budget
                </Button>
            </div>

            {/* Financial Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
                        <p className="text-xs text-muted-foreground">Across all projects</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Spent to Date</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatPercentage((totalSpent / totalBudget) * 100)} of budget
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Committed</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalCommitted)}</div>
                        <p className="text-xs text-muted-foreground">Future obligations</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Variance</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${totalVariance >= 0 ? 'text-green-600' : 'text-destructive'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {formatCurrency(Math.abs(totalVariance))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {totalVariance >= 0 ? 'Under' : 'Over'} budget
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="budgets">
                <TabsList>
                    <TabsTrigger value="budgets">Budgets</TabsTrigger>
                    <TabsTrigger value="rates">Rate Cards</TabsTrigger>
                    <TabsTrigger value="costs">Costs</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                </TabsList>

                <TabsContent value="budgets" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Budgets</CardTitle>
                            <CardDescription>Budget allocation and utilization by project</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mockProjects.map((project) => {
                                    const spentPercent = (project.budget.spentToDate / project.budget.totalBudget) * 100
                                    const isOverBudget = project.budget.variance < 0

                                    return (
                                        <div key={project.id} className="space-y-2 p-4 border rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium">{project.name}</p>
                                                    <p className="text-sm text-muted-foreground">{project.code}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">
                                                        {formatCurrency(project.budget.spentToDate)} / {formatCurrency(project.budget.totalBudget)}
                                                    </p>
                                                    <p className={`text-xs ${isOverBudget ? 'text-destructive' : 'text-green-600'}`}>
                                                        Variance: {formatCurrency(Math.abs(project.budget.variance))}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Utilization</span>
                                                    <span className={isOverBudget ? 'text-destructive font-medium' : ''}>
                                                        {formatPercentage(spentPercent)}
                                                    </span>
                                                </div>
                                                <Progress value={Math.min(spentPercent, 100)} className="h-2" />
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                                                {project.budget.categories.map((cat) => (
                                                    <div key={cat.name} className="text-xs">
                                                        <p className="text-muted-foreground">{cat.name}</p>
                                                        <p className="font-medium">{formatCurrency(cat.spent)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Rate Cards</CardTitle>
                                    <CardDescription>Billing rates by role and region</CardDescription>
                                </div>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Rate Card
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[
                                    { role: "Senior Developer", region: "US", rate: 180, billable: 220 },
                                    { role: "Developer", region: "US", rate: 120, billable: 150 },
                                    { role: "Project Manager", region: "US", rate: 150, billable: 190 },
                                    { role: "Designer", region: "US", rate: 100, billable: 130 },
                                ].map((rate) => (
                                    <div key={`${rate.role}-${rate.region}`} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{rate.role}</p>
                                            <p className="text-sm text-muted-foreground">{rate.region}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                Cost: {formatCurrency(rate.rate)}/hr
                                            </p>
                                            <p className="text-sm text-green-600">
                                                Bill: {formatCurrency(rate.billable)}/hr
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="costs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cost Tracking</CardTitle>
                            <CardDescription>Project expenses and costs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                <div className="text-center">
                                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">Cost tracking view coming soon</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invoices" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoices</CardTitle>
                            <CardDescription>Billing and invoice management</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                <div className="text-center">
                                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">Invoice management coming soon</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

