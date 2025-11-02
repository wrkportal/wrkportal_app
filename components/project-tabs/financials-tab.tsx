'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { Plus, DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"

interface FinancialsTabProps {
    project: any
}

export function FinancialsTab({ project }: FinancialsTabProps) {
    if (!project) return <div>Project not found</div>

    const budget = project.budget || { total: 0, spent: 0, committed: 0 }

    return (
        <div className="space-y-6">
            {/* Remove duplicate header since we have project header above */}
            {/* Financial Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(budget.total || 0)}</div>
                        <p className="text-xs text-muted-foreground">Allocated budget</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Spent to Date</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(budget.spent || 0)}</div>
                        <Progress value={budget.total ? ((budget.spent || 0) / budget.total) * 100 : 0} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Committed</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(budget.committed)}</div>
                        <p className="text-xs text-muted-foreground">Reserved funds</p>
                    </CardContent>
                </Card>

            </div>

            {/* Sub-tabs for detailed views */}
            <Tabs defaultValue="budget">
                <TabsList>
                    <TabsTrigger value="budget">Budget Details</TabsTrigger>
                    <TabsTrigger value="rates">Rate Cards</TabsTrigger>
                    <TabsTrigger value="costs">Costs</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                </TabsList>

                <TabsContent value="budget" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Budget Summary</CardTitle>
                            <CardDescription>Financial overview for {project.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                                    <p className="text-2xl font-bold">{formatCurrency(budget.total || 0)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Spent</p>
                                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(budget.spent || 0)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Available</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency((budget.total || 0) - (budget.spent || 0) - (budget.committed || 0))}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Budget Utilization</span>
                                    <span className="font-medium">
                                        {budget.total ? Math.round(((budget.spent || 0) / budget.total) * 100) : 0}%
                                    </span>
                                </div>
                                <Progress value={budget.total ? ((budget.spent || 0) / budget.total) * 100 : 0} />
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
                                    <CardDescription>Billing rates for this project</CardDescription>
                                </div>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Rate Card
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                <div className="text-center">
                                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">Rate cards coming soon</p>
                                    <p className="text-xs text-muted-foreground mt-2">Configure billing rates for different roles and regions</p>
                                </div>
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
                                    <p className="text-muted-foreground">Cost tracking for {project.name}</p>
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
                                    <p className="text-muted-foreground">Invoice management for {project.name}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

