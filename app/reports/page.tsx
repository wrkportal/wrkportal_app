'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplateTableView } from '@/components/reports/template-table-view'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    BarChart3,
    FileText,
    TrendingUp,
    Download,
    Target,
    FolderKanban,
    CheckCircle2,
    DollarSign,
    Activity,
    Upload,
    Calendar,
    Clock,
    Plus,
    Eye,
    Trash2,
    Edit2,
    FileSpreadsheet,
    FileType,
    FilePieChart,
    Presentation,
    PieChart,
    LineChart
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ReportData {
    summary: {
        projects: any
        okrs: any
        tasks: any
        programs: any
    }
    timeline: any[]
    projects: any[]
    goals: any[]
}

interface UploadedReport {
    id: string
    name: string
    description: string
    type: string
    uploadedBy: string
    uploadedAt: Date
    fileSize: string
    views: number
}

interface Template {
    id: string
    name: string
    description: string
    format: string
    columns: string[]
    rows: string[][]
    category: string
    createdAt: Date
}

export default function ReportsPage() {
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [reportType, setReportType] = useState('overview')
    const [dateRange, setDateRange] = useState('all')

    // Scheduled Reports State
    const [uploadedReports, setUploadedReports] = useState<UploadedReport[]>([])

    // Templates State
    const [templates, setTemplates] = useState<Template[]>([])

    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [showTemplateBuilder, setShowTemplateBuilder] = useState(false)
    
    // Persist template builder state
    const [templateBuilderColumns, setTemplateBuilderColumns] = useState<any[] | undefined>(undefined)
    const [templateBuilderRows, setTemplateBuilderRows] = useState<any[] | undefined>(undefined)

    // Fetch report data for Live Reporting
    const fetchReportData = async () => {
        try {
            setIsLoading(true)

            let startDate = ''
            let endDate = new Date().toISOString()

            if (dateRange === 'month') {
                const date = new Date()
                date.setMonth(date.getMonth() - 1)
                startDate = date.toISOString()
            } else if (dateRange === 'quarter') {
                const date = new Date()
                date.setMonth(date.getMonth() - 3)
                startDate = date.toISOString()
            } else if (dateRange === 'year') {
                const date = new Date()
                date.setFullYear(date.getFullYear() - 1)
                startDate = date.toISOString()
            }

            const params = new URLSearchParams({
                type: reportType,
                ...(startDate && { startDate, endDate })
            })

            const response = await fetch(`/api/reports?${params}`)
            if (response.ok) {
                const data = await response.json()
                setReportData(data)
            }
        } catch (error) {
            console.error('Error fetching report data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchReportData()
    }, [reportType, dateRange])

    // Export Live Report functionality with actual download
    const handleExport = (format: 'excel' | 'pdf') => {
        if (!reportData) return

        if (format === 'excel') {
            // Create CSV content
            let csvContent = "Project Management Report\n\n"
            csvContent += `Generated: ${new Date().toLocaleString()}\n\n`

            // Summary Section
            csvContent += "SUMMARY\n"
            csvContent += `Total Projects,${reportData.summary.projects.total}\n`
            csvContent += `Active Projects,${reportData.summary.projects.byStatus?.ACTIVE || 0}\n`
            csvContent += `Total Tasks,${reportData.summary.tasks.total}\n`
            csvContent += `Completed Tasks,${reportData.summary.tasks.completed}\n`
            csvContent += `Total Goals,${reportData.summary.okrs.totalGoals}\n\n`

            // Projects Section
            csvContent += "PROJECTS DETAIL\n"
            csvContent += "Project Name,Status,Priority,Progress %,Budget,Actual Cost\n"
            reportData.projects.forEach(p => {
                csvContent += `"${p.name}",${p.status},${p.priority},${p.progress},${p.budget},${p.actualCost}\n`
            })

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `report_${new Date().getTime()}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } else {
            // For PDF, create a simple HTML representation
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Project Management Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        h1 { color: #333; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #4F46E5; color: white; }
                        .summary { background-color: #f9f9f9; padding: 20px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>Project Management Report</h1>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    
                    <div class="summary">
                        <h2>Summary</h2>
                        <p><strong>Total Projects:</strong> ${reportData.summary.projects.total}</p>
                        <p><strong>Active Projects:</strong> ${reportData.summary.projects.byStatus?.ACTIVE || 0}</p>
                        <p><strong>Total Tasks:</strong> ${reportData.summary.tasks.total}</p>
                        <p><strong>Completed Tasks:</strong> ${reportData.summary.tasks.completed}</p>
                        <p><strong>Total Goals:</strong> ${reportData.summary.okrs.totalGoals}</p>
                    </div>
                    
                    <h2>Projects</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Project Name</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Budget</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.projects.map(p => `
                                <tr>
                                    <td>${p.name}</td>
                                    <td>${p.status}</td>
                                    <td>${p.progress}%</td>
                                    <td>$${p.budget.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `

            // Open in new window for printing
            const printWindow = window.open('', '_blank')
            if (printWindow) {
                printWindow.document.write(printContent)
                printWindow.document.close()
                printWindow.print()
            }
        }
    }

    const handleUploadReport = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const newReport: UploadedReport = {
            id: Date.now().toString(),
            name: formData.get('fileName') as string,
            description: formData.get('description') as string,
            type: (formData.get('fileType') as string).toLowerCase(),
            uploadedBy: 'Current User',
            uploadedAt: new Date(),
            fileSize: '3.5 MB',
            views: 0
        }

        setUploadedReports([newReport, ...uploadedReports])
        setUploadDialogOpen(false)
        alert('✅ Report uploaded successfully!')
    }

    const handleSaveTemplate = (templateData: {
        name: string
        description: string
        format: string
        category: string
        columns: string[]
        rows: string[][]
    }) => {
        const newTemplate: Template = {
            id: Date.now().toString(),
            name: templateData.name,
            description: templateData.description,
            format: templateData.format,
            columns: templateData.columns,
            rows: templateData.rows,
            category: templateData.category,
            createdAt: new Date()
        }

        setTemplates([newTemplate, ...templates])
        alert('✅ Template saved successfully!')
        setShowTemplateBuilder(false)
        // Reset builder state after saving
        setTemplateBuilderColumns(undefined)
        setTemplateBuilderRows(undefined)
    }

    const handleCancelTemplateBuilder = () => {
        setShowTemplateBuilder(false)
        // Reset builder state
        setTemplateBuilderColumns(undefined)
        setTemplateBuilderRows(undefined)
    }

    const handleTemplateStateChange = (columns: any[], rows: any[]) => {
        setTemplateBuilderColumns(columns)
        setTemplateBuilderRows(rows)
    }

    // Download template with actual file generation
    const handleDownloadTemplate = (template: Template) => {
        let content = ''
        let filename = ''
        let mimeType = ''

        if (template.format === 'excel' || template.format === 'csv') {
            // Create CSV format with columns and rows
            content = template.columns.join(',') + '\n'
            content += template.rows.map(row => row.join(',')).join('\n')

            filename = `${template.name.replace(/\s+/g, '_')}.csv`
            mimeType = 'text/csv;charset=utf-8;'
        } else if (template.format === 'pdf') {
            // Create HTML table format
            content = `<!DOCTYPE html>
<html>
<head>
    <title>${template.name}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; }
        h1 { color: #4F46E5; border-bottom: 3px solid #4F46E5; padding-bottom: 10px; }
        .description { background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-left: 4px solid #4F46E5; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4F46E5; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <h1>${template.name}</h1>
    <div class="description">
        <strong>Description:</strong> ${template.description || 'N/A'}<br>
        <strong>Category:</strong> ${template.category.toUpperCase()}<br>
        <strong>Created:</strong> ${template.createdAt.toLocaleDateString()}
    </div>
    
    <table>
        <thead>
            <tr>
                ${template.columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${template.rows.map(row => `
                <tr>
                    ${row.map(cell => `<td>${cell || '&nbsp;'}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        <p>Template generated from Project Management System</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`

            filename = `${template.name.replace(/\s+/g, '_')}.html`
            mimeType = 'text/html;charset=utf-8;'
        }

        // Download the file
        const blob = new Blob([content], { type: mimeType })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Download uploaded report (simulated)
    const handleDownloadReport = (report: UploadedReport) => {
        // Create a dummy file for demonstration
        const content = `This is a simulated download of: ${report.name}\n\n` +
            `Description: ${report.description}\n` +
            `Type: ${report.type}\n` +
            `Uploaded by: ${report.uploadedBy}\n` +
            `Upload date: ${report.uploadedAt.toLocaleString()}\n\n` +
            `In production, this would download the actual file from storage.`

        const blob = new Blob([content], { type: 'text/plain' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', report.name.replace(/\.(xlsx|pptx|pdf)$/, '.txt'))
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

    }

    const handleDeleteReport = (id: string) => {
        if (confirm('Are you sure you want to delete this report?')) {
            setUploadedReports(uploadedReports.filter(r => r.id !== id))
            alert('✅ Report deleted successfully!')
        }
    }

    const handleDeleteTemplate = (id: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            setTemplates(templates.filter(t => t.id !== id))
            alert('✅ Template deleted successfully!')
        }
    }

    const getFileIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'excel':
                return <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            case 'powerpoint':
                return <Presentation className="h-8 w-8 text-muted-foreground" />
            case 'pdf':
                return <FileText className="h-8 w-8 text-muted-foreground" />
            case 'powerbi':
                return <FilePieChart className="h-8 w-8 text-muted-foreground" />
            default:
                return <FileType className="h-8 w-8 text-muted-foreground" />
        }
    }

    return (
        <div className="space-y-6">
            {/* Header - Sticky */}
            <div className="sticky top-0 md:top-12 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 md:pt-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Reports & Analytics
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Live insights, scheduled reports, and custom templates
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="live" className="space-y-6">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
                    <TabsTrigger value="live" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                        <Activity className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Live Reporting</span>
                        <span className="sm:hidden">Live</span>
                    </TabsTrigger>
                    <TabsTrigger value="scheduled" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                        <Upload className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Scheduled Reports</span>
                        <span className="sm:hidden">Scheduled</span>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                        <FileText className="h-3 w-3 md:h-4 md:w-4" />
                        Templates
                    </TabsTrigger>
                </TabsList>

                {/* LIVE REPORTING TAB */}
                <TabsContent value="live" className="space-y-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : reportData ? (
                        <>
                            {/* Controls */}
                            <div className="flex gap-2 justify-end">
                                <Select value={dateRange} onValueChange={setDateRange}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Time</SelectItem>
                                        <SelectItem value="month">Last Month</SelectItem>
                                        <SelectItem value="quarter">Last Quarter</SelectItem>
                                        <SelectItem value="year">Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" onClick={() => handleExport('excel')}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Excel
                                </Button>
                                <Button variant="outline" onClick={() => handleExport('pdf')}>
                                    <Download className="mr-2 h-4 w-4" />
                                    PDF
                                </Button>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                        <CardTitle className="text-base font-medium">Total Projects</CardTitle>
                                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{reportData.summary.projects.total}</div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                {reportData.summary.projects.byStatus?.ACTIVE || 0} Active
                                            </Badge>
                                        </div>
                                        <Progress value={reportData.summary.projects.avgProgress || 0} className="h-1 mt-2" />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                        <CardTitle className="text-base font-medium">Tasks</CardTitle>
                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{reportData.summary.tasks.total}</div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-green-600">
                                                ✓ {reportData.summary.tasks.completed} Done
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                        <CardTitle className="text-base font-medium">Goals & OKRs</CardTitle>
                                        <Target className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{reportData.summary.okrs.totalGoals}</div>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            {reportData.summary.okrs.totalKeyResults} Key Results
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                        <CardTitle className="text-base font-medium">Budget</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            ${((reportData.summary.projects.totalBudget || 0) / 1000).toFixed(0)}K
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            Spent: ${((reportData.summary.projects.totalSpent || 0) / 1000).toFixed(0)}K
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Nested Tabs for Live Report Types */}
                            <Tabs defaultValue="overview" className="space-y-4">
                                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                                    <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
                                    <TabsTrigger value="projects" className="text-xs md:text-sm">Projects ({reportData.projects.length})</TabsTrigger>
                                    <TabsTrigger value="okrs" className="text-xs md:text-sm">OKRs ({reportData.goals.length})</TabsTrigger>
                                    <TabsTrigger value="financial" className="text-xs md:text-sm">Financial</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Activity Trends (Last 6 Months)</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {reportData.timeline.map((month) => (
                                                    <div key={month.month} className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="font-medium">{month.month}</span>
                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                <span>📁 {month.projectsCreated} Projects</span>
                                                                <span>✓ {month.tasksCompleted} Tasks</span>
                                                            </div>
                                                        </div>
                                                        <Progress value={(month.projectsCreated / 10) * 100} className="h-2" />
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="projects" className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Project Details Report</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {reportData.projects.map((project) => (
                                                    <div key={project.id} className="border rounded-lg p-4 space-y-2">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="font-medium">{project.name}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge>{project.status}</Badge>
                                                                    <Badge variant="secondary">{project.priority}</Badge>
                                                                </div>
                                                            </div>
                                                            <div className="text-2xl font-bold text-blue-600">
                                                                {project.progress}%
                                                            </div>
                                                        </div>
                                                        <Progress value={project.progress} className="h-2" />
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="okrs" className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Goals & OKRs Performance</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {reportData.goals.map((goal) => (
                                                    <div key={goal.id} className="border rounded-lg p-4 space-y-2">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="font-medium">{goal.title}</h4>
                                                                <Badge className="mt-1">{goal.status}</Badge>
                                                            </div>
                                                            <div className="text-2xl font-bold text-purple-600">
                                                                {(goal.avgProgress || 0).toFixed(0)}%
                                                            </div>
                                                        </div>
                                                        <Progress value={goal.avgProgress || 0} className="h-2" />
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="financial" className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Total Budget</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">
                                                    ${reportData.summary.projects.totalBudget.toLocaleString()}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Actual Spending</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-orange-600">
                                                    ${(reportData.summary.projects.totalSpent || 0).toLocaleString()}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Remaining</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-green-600">
                                                    ${((reportData.summary.projects.totalBudget || 0) - (reportData.summary.projects.totalSpent || 0)).toLocaleString()}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-muted-foreground">No data available</p>
                        </div>
                    )}
                </TabsContent>

                {/* SCHEDULED REPORTS TAB */}
                <TabsContent value="scheduled" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Report
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[525px]">
                                <DialogHeader>
                                    <DialogTitle>Upload New Report</DialogTitle>
                                    <DialogDescription>
                                        Share Excel, PowerPoint, PDF, or Power BI reports with your team
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleUploadReport} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fileName">Report Name *</Label>
                                        <Input id="fileName" name="fileName" placeholder="Q4 Executive Summary" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea id="description" name="description" placeholder="Brief description of the report..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fileType">File Type *</Label>
                                        <Select name="fileType" required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select file type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                                                <SelectItem value="powerpoint">PowerPoint (.pptx)</SelectItem>
                                                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                                                <SelectItem value="powerbi">Power BI</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="file">Upload File *</Label>
                                        <Input id="file" name="file" type="file" required />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="outline">Upload Report</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {uploadedReports.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                                <Upload className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                <p className="text-sm text-muted-foreground mb-2">No reports uploaded yet</p>
                                <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Your First Report
                                </Button>
                            </div>
                        ) : uploadedReports.map((report) => (
                            <Card key={report.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {getFileIcon(report.type)}
                                            <div>
                                                <CardTitle className="text-base">{report.name}</CardTitle>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {report.uploadedBy}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {report.description}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{report.fileSize}</span>
                                        <span>{report.uploadedAt.toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownloadReport(report)}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDeleteReport(report.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* TEMPLATES TAB */}
                <TabsContent value="templates" className="space-y-6">
                    {!showTemplateBuilder ? (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Report Templates</h3>
                                    <p className="text-sm text-muted-foreground">Create and manage custom report templates</p>
                                </div>
                                <Button variant="outline" onClick={() => setShowTemplateBuilder(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Template
                                </Button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {templates.length === 0 ? (
                                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                                        <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                        <p className="text-sm text-muted-foreground mb-2">No templates created yet</p>
                                        <Button variant="outline" onClick={() => setShowTemplateBuilder(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Your First Template
                                        </Button>
                                    </div>
                                ) : templates.map((template) => (
                                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        {template.name}
                                                        <Badge variant="outline">{template.format}</Badge>
                                                    </CardTitle>
                                                    <CardDescription className="mt-2">
                                                        {template.description}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <p className="text-sm font-medium mb-2">Columns:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {template.columns.map((col, index) => (
                                                        <Badge key={index} variant="secondary" className="text-xs">
                                                            {col}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Created: {template.createdAt.toLocaleDateString()}
                                            </div>
                                            <div className="flex gap-2 pt-2 border-t">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={() => handleDownloadTemplate(template)}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div>
                            <TemplateTableView
                                onSave={handleSaveTemplate}
                                onCancel={handleCancelTemplateBuilder}
                                onStateChange={handleTemplateStateChange}
                                initialColumns={templateBuilderColumns}
                                initialRows={templateBuilderRows}
                            />
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
