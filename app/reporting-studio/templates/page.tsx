'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    FileStack,
    Plus,
    Search,
    Download,
    Eye,
    Trash2,
    LayoutDashboard,
    BarChart3,
    PieChart,
    LineChart,
    TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Template {
    id: string
    name: string
    description: string
    category: 'dashboard' | 'chart' | 'report'
    icon: any
    color: string
    previewImage?: string
}

const sampleTemplates: Template[] = [
    {
        id: '1',
        name: 'Executive Dashboard',
        description: 'High-level overview with KPIs and metrics',
        category: 'dashboard',
        icon: LayoutDashboard,
        color: 'text-blue-500',
    },
    {
        id: '2',
        name: 'Sales Analytics',
        description: 'Track sales performance and trends',
        category: 'dashboard',
        icon: TrendingUp,
        color: 'text-green-500',
    },
    {
        id: '3',
        name: 'Revenue Chart',
        description: 'Bar chart for revenue tracking',
        category: 'chart',
        icon: BarChart3,
        color: 'text-purple-500',
    },
    {
        id: '4',
        name: 'Distribution Chart',
        description: 'Pie chart for data distribution',
        category: 'chart',
        icon: PieChart,
        color: 'text-orange-500',
    },
    {
        id: '5',
        name: 'Trend Analysis',
        description: 'Line chart for trend visualization',
        category: 'chart',
        icon: LineChart,
        color: 'text-cyan-500',
    },
]

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>(sampleTemplates)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'dashboard' | 'chart' | 'report'>('all')

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <FileStack className="h-8 w-8" />
                    Canvas Templates
                </h1>
                <p className="text-muted-foreground mt-1">
                    Pre-built templates for dashboards, charts, and reports
                </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={selectedCategory === 'dashboard' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('dashboard')}
                    >
                        Dashboards
                    </Button>
                    <Button
                        variant={selectedCategory === 'chart' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('chart')}
                    >
                        Charts
                    </Button>
                    <Button
                        variant={selectedCategory === 'report' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('report')}
                    >
                        Reports
                    </Button>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => {
                    const Icon = template.icon
                    return (
                        <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-lg bg-muted flex items-center justify-center",
                                        )}>
                                            <Icon className={cn("h-6 w-6", template.color)} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{template.name}</CardTitle>
                                            <Badge variant="secondary" className="mt-1 text-xs">
                                                {template.category}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <CardDescription className="mt-2">
                                    {template.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Eye className="h-3 w-3 mr-1" />
                                        Preview
                                    </Button>
                                    <Button variant="default" size="sm" className="flex-1">
                                        <Download className="h-3 w-3 mr-1" />
                                        Use Template
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileStack className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                    <p className="text-sm text-muted-foreground">
                        Try adjusting your search or filter criteria
                    </p>
                </div>
            )}

            {/* Info Card */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileStack className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Build Your Own Templates</h3>
                            <p className="text-sm text-muted-foreground">
                                Create custom canvas templates in the Data Lab and save them for future use. 
                                Templates can include pre-configured charts, layouts, and styling that you can 
                                quickly apply to new projects.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

