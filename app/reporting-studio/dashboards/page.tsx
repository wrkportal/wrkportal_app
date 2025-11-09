'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutGrid, Eye, Calendar, User, Loader2, Trash2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Dashboard {
    id: string
    name: string
    configuration: {
        charts: any[]
        layout: any[]
        pageBackgroundColor: string
        activeFilters: Record<string, string[]>
    }
    createdAt: string
    updatedAt: string
    createdByUser: {
        name: string | null
        email: string
    }
}

export default function DashboardsPage() {
    const router = useRouter()
    const [dashboards, setDashboards] = useState<Dashboard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDashboards = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/reporting-studio/dashboard')
            if (response.ok) {
                const data = await response.json()
                setDashboards(data.dashboards || [])
            } else {
                setError('Failed to load dashboards')
            }
        } catch (err) {
            console.error('Error fetching dashboards:', err)
            setError('Error loading dashboards')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboards()
    }, [])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutGrid className="h-6 w-6" />
                        Dashboards
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View and manage your saved dashboard views
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchDashboards}
                        disabled={loading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Link href="/reporting-studio/data-lab">
                        <Button>
                            Create New Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <p className="text-red-500">{error}</p>
                            <Button 
                                variant="outline" 
                                onClick={fetchDashboards}
                                className="mt-4"
                            >
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : dashboards.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Dashboards Yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first dashboard in the Data Lab
                            </p>
                            <Link href="/reporting-studio/data-lab">
                                <Button>
                                    Go to Data Lab
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboards.map((dashboard) => (
                        <Card 
                            key={dashboard.id} 
                            className="hover:shadow-lg transition-shadow cursor-pointer group"
                            onClick={() => router.push(`/reporting-studio/dashboards/${dashboard.id}`)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                            {dashboard.name}
                                        </CardTitle>
                                        <CardDescription className="mt-2 flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            {dashboard.createdByUser.name || dashboard.createdByUser.email}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary">
                                        {dashboard.configuration.charts.length} charts
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>Created: {formatDate(dashboard.createdAt)}</span>
                                    </div>
                                    {dashboard.updatedAt !== dashboard.createdAt && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <RefreshCw className="h-3 w-3" />
                                            <span>Updated: {formatDate(dashboard.updatedAt)}</span>
                                        </div>
                                    )}
                                    {Object.keys(dashboard.configuration.activeFilters).length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            Active Filters: {Object.keys(dashboard.configuration.activeFilters).length}
                                        </div>
                                    )}
                                    <div className="pt-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                router.push(`/reporting-studio/dashboards/${dashboard.id}`)
                                            }}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Dashboard
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

