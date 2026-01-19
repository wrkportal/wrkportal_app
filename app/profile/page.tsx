'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuthStore, canAccessScreen, fetchAuthenticatedUser } from "@/stores/authStore"
import { getInitials } from "@/lib/utils"
import {
    User,
    Mail,
    Briefcase,
    Calendar,
    Settings,
    Edit,
    Home,
    CheckCircle2
} from "lucide-react"

// Available pages/screens
const availablePages = [
    { id: 2, name: "Battlefield", path: "/wrkboard" },
    { id: 3, name: "Projects", path: "/projects" },
    { id: 4, name: "Programs", path: "/programs" },
    { id: 5, name: "Portfolios", path: "/portfolios" },
    { id: 6, name: "OKRs", path: "/okrs" },
    { id: 7, name: "Roadmap", path: "/roadmap" },
    { id: 8, name: "Reports", path: "/reports" },
    { id: 9, name: "Resources", path: "/resources" },
    { id: 10, name: "RAID", path: "/raid" },
    { id: 11, name: "Timesheets", path: "/timesheets" },
    { id: 12, name: "Financials", path: "/finance-dashboard" },
    { id: 13, name: "Changes", path: "/changes" },
    { id: 14, name: "Approvals", path: "/approvals" },
    { id: 15, name: "Notifications", path: "/notifications" },
    { id: 17, name: "Automations", path: "/automations" },
    { id: 19, name: "Admin - Organization", path: "/admin/organization" },
    { id: 20, name: "Admin - Security", path: "/admin/security" },
    { id: 21, name: "Admin - Audit", path: "/admin/audit" },
    { id: 22, name: "Settings", path: "/settings" },
]

interface ProfileStats {
    activeProjects: number
    projectsAsLead: number
    tasksCompleted: number
    hoursLogged: number
}

interface RecentActivity {
    id: string
    action: string
    entityType: string
    entityName: string
    timestamp: string
}

export default function ProfilePage() {
    const router = useRouter()
    const user = useAuthStore((state) => state.user)
    const setUser = useAuthStore((state) => state.setUser)
    const [stats, setStats] = useState<ProfileStats>({
        activeProjects: 0,
        projectsAsLead: 0,
        tasksCompleted: 0,
        hoursLogged: 0,
    })
    const [loadingStats, setLoadingStats] = useState(true)
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
    const [loadingActivity, setLoadingActivity] = useState(true)
    const [landingPage, setLandingPage] = useState(user?.landingPage || "/my-work")
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Fetch real user data on component mount
    useEffect(() => {
        const loadUser = async () => {
            setIsLoading(true)
            const authenticatedUser = await fetchAuthenticatedUser()
            if (authenticatedUser) {
                setUser(authenticatedUser)
                setLandingPage(authenticatedUser.landingPage || "/my-work")
            }
            setIsLoading(false)
        }
        loadUser()
    }, [setUser])

    // Fetch profile stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/user/profile/stats')
                if (response.ok) {
                    const data = await response.json()
                    setStats(data)
                }
            } catch (error) {
                console.error('Error fetching profile stats:', error)
            } finally {
                setLoadingStats(false)
            }
        }
        if (user) {
            fetchStats()
        }
    }, [user])

    // Fetch recent activity
    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await fetch('/api/user/profile/activity')
                if (response.ok) {
                    const data = await response.json()
                    setRecentActivity(data.activities || [])
                }
            } catch (error) {
                console.error('Error fetching recent activity:', error)
            } finally {
                setLoadingActivity(false)
            }
        }
        if (user) {
            fetchActivity()
        }
    }, [user])

    // Filter pages based on user role permissions
    const accessiblePages = user ? availablePages.filter(page => canAccessScreen(user.role, page.id)) : []

    const handleSaveLandingPage = async () => {
        if (!user) return

        setIsSaving(true)
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ landingPage }),
            })

            if (response.ok) {
                const data = await response.json()
                setUser(data.user)
            } else {
                console.error('Failed to update landing page')
            }
        } catch (error) {
            console.error('Error updating landing page:', error)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
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
                            Profile
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            View and manage your profile information
                        </p>
                    </div>
                    <Button onClick={() => router.push('/settings')} className="gap-2">
                        <Settings className="h-4 w-4" />
                        Edit Settings
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <Avatar className="h-32 w-32 border-4 border-purple-200 dark:border-purple-800">
                                <AvatarImage src={user.avatar} alt={user.firstName} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-3xl font-bold">
                                    {getInitials(user.firstName, user.lastName)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">
                                    {user.firstName} {user.lastName}
                                </h2>
                                <Badge className="text-sm">{user.role}</Badge>
                            </div>

                            <Separator />

                            <div className="w-full space-y-3 text-left">
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-slate-500" />
                                    <span className="text-slate-600 dark:text-slate-400">{user.email}</span>
                                </div>
                                {user.role && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Briefcase className="h-4 w-4 text-slate-500" />
                                        <span className="text-slate-600 dark:text-slate-400">{user.role.replace(/_/g, ' ')}</span>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full gap-2"
                                variant="outline"
                                onClick={() => router.push('/settings')}
                            >
                                <Edit className="h-4 w-4" />
                                Edit Profile
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Activity & Stats */}
                <div className="md:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loadingStats ? '...' : stats.activeProjects}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {loadingStats ? 'Loading...' : `${stats.projectsAsLead} as lead`}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loadingStats ? '...' : stats.tasksCompleted}
                                </div>
                                <p className="text-xs text-muted-foreground">This quarter</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loadingStats ? '...' : `${stats.hoursLogged}h`}
                                </div>
                                <p className="text-xs text-muted-foreground">This month</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Your recent actions and updates</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loadingActivity ? (
                                    <p className="text-center py-8 text-muted-foreground">Loading activity...</p>
                                ) : recentActivity.length === 0 ? (
                                    <p className="text-center py-8 text-muted-foreground">No recent activity found.</p>
                                ) : (
                                    recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-purple-500" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">
                                                    {activity.action} <span className="text-muted-foreground">&quot;{activity.entityName}&quot;</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skills & Expertise */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Skills & Expertise</CardTitle>
                            <CardDescription>Your technical skills and areas of expertise</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {['React', 'TypeScript', 'Node.js', 'Project Management', 'Agile', 'Leadership', 'UI/UX Design', 'System Architecture'].map((skill) => (
                                    <Badge key={skill} variant="outline" className="px-3 py-1">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Home className="h-5 w-5" />
                                Preferences
                            </CardTitle>
                            <CardDescription>Customize your experience</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="landing-page" className="text-sm font-medium">
                                        Landing Page
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Choose which page to see when you first log in
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Select value={landingPage} onValueChange={setLandingPage}>
                                        <SelectTrigger id="landing-page" className="flex-1">
                                            <SelectValue placeholder="Select a landing page" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accessiblePages.map((page) => (
                                                <SelectItem key={page.id} value={page.path}>
                                                    {page.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        onClick={handleSaveLandingPage}
                                        disabled={isSaving || landingPage === user.landingPage}
                                        className="gap-2"
                                    >
                                        {isSaving ? (
                                            <>Saving...</>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Save
                                            </>
                                        )}
                                    </Button>
                                </div>
                                {landingPage !== user.landingPage && (
                                    <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                        <span>⚠️</span>
                                        You have unsaved changes
                                    </p>
                                )}
                                {landingPage === user.landingPage && user.landingPage && (
                                    <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Landing page is set to: {accessiblePages.find(p => p.path === user.landingPage)?.name}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

