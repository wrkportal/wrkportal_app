'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import { UserRole } from "@/types"
import {
    LayoutDashboard,
    FolderKanban,
    Target,
    Users,
    Clock,
    CheckSquare,
    AlertTriangle,
    BarChart3,
    DollarSign,
    Settings,
    Shield,
    FileText,
    Calendar,
    Briefcase,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Trash2,
    Home,
    Sparkles,
    Bot,
    Map,
    GraduationCap,
    MessageSquare,
    Database,
    Beaker,
    LayoutGrid,
    FileStack,
} from "lucide-react"
import { useUIStore } from "@/stores/uiStore"
import { Button } from "@/components/ui/button"

interface NavItem {
    title: string
    href: string
    icon: any
    roles: UserRole[]
    children?: NavItem[]
}

const navigationItems: NavItem[] = [
    {
        title: "Home",
        href: "/my-work",
        icon: Home,
        roles: Object.values(UserRole),
    },
    {
        title: "Programs & Projects",
        href: "/projects",
        icon: Briefcase,
        roles: Object.values(UserRole),
        children: [
            {
                title: "Programs",
                href: "/programs",
                icon: Briefcase,
                roles: Object.values(UserRole),
            },
            {
                title: "Roadmap",
                href: "/roadmap",
                icon: Map,
                roles: Object.values(UserRole),
            },
        ],
    },
    {
        title: "Reporting Studio",
        href: "/reporting-studio",
        icon: Sparkles,
        roles: Object.values(UserRole),
        children: [
            {
                title: "Database",
                href: "/reporting-studio/database",
                icon: Database,
                roles: Object.values(UserRole),
            },
            {
                title: "Data Lab",
                href: "/reporting-studio/data-lab",
                icon: Beaker,
                roles: Object.values(UserRole),
            },
            {
                title: "Dashboards",
                href: "/reporting-studio/dashboards",
                icon: LayoutGrid,
                roles: Object.values(UserRole),
            },
            {
                title: "Templates",
                href: "/reporting-studio/templates",
                icon: FileStack,
                roles: Object.values(UserRole),
            },
        ],
    },
    {
        title: "Performance",
        href: "/performance",
        icon: TrendingUp,
        roles: Object.values(UserRole),
        children: [
            {
                title: "Goals & OKRs",
                href: "/okrs",
                icon: Target,
                roles: [
                    UserRole.PLATFORM_OWNER,
                    UserRole.TENANT_SUPER_ADMIN,
                    UserRole.ORG_ADMIN,
                    UserRole.PMO_LEAD,
                    UserRole.PROJECT_MANAGER,
                    UserRole.TEAM_MEMBER,
                    UserRole.EXECUTIVE,
                ],
            },
        ],
    },
    {
        title: "Communication",
        href: "/communication",
        icon: MessageSquare,
        roles: Object.values(UserRole),
        children: [
            {
                title: "Chat box",
                href: "/collaborate",
                icon: MessageSquare,
                roles: Object.values(UserRole),
            },
        ],
    },
    {
        title: "Planet AI",
        href: "/planet-ai",
        icon: Bot,
        roles: Object.values(UserRole),
        children: [
            {
                title: "AI Assistant",
                href: "/ai-assistant",
                icon: Bot,
                roles: Object.values(UserRole),
            },
            {
                title: "AI Tools",
                href: "/ai-tools",
                icon: Sparkles,
                roles: Object.values(UserRole),
            },
        ],
    },
]

const academyNavItem: NavItem = {
    title: "Academy",
    href: "/academy",
    icon: GraduationCap,
    roles: Object.values(UserRole),
}

const collaborateNavItem: NavItem = {
    title: "Collaborate",
    href: "/collaborate",
    icon: MessageSquare,
    roles: Object.values(UserRole),
}

const adminNavItem: NavItem = {
    title: "Admin",
    href: "/admin",
    icon: Settings,
    roles: [UserRole.PLATFORM_OWNER, UserRole.TENANT_SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.INTEGRATION_ADMIN],
    children: [
        {
            title: "Organization",
            href: "/admin/organization",
            icon: Users,
            roles: [UserRole.PLATFORM_OWNER, UserRole.TENANT_SUPER_ADMIN, UserRole.ORG_ADMIN],
        },
        {
            title: "Domain Verification",
            href: "/admin/domain-verification",
            icon: Shield,
            roles: [UserRole.PLATFORM_OWNER, UserRole.TENANT_SUPER_ADMIN],
        },
        {
            title: "Tutorials",
            href: "/admin/tutorials",
            icon: GraduationCap,
            roles: [UserRole.PLATFORM_OWNER, UserRole.TENANT_SUPER_ADMIN],
        },
        {
            title: "SSO Settings",
            href: "/admin/sso-settings",
            icon: Shield,
            roles: [UserRole.PLATFORM_OWNER, UserRole.TENANT_SUPER_ADMIN, UserRole.ORG_ADMIN],
        },
        {
            title: "Security",
            href: "/admin/security",
            icon: Shield,
            roles: [UserRole.PLATFORM_OWNER, UserRole.TENANT_SUPER_ADMIN],
        },
        {
            title: "Audit Log",
            href: "/admin/audit",
            icon: FileText,
            roles: [
                UserRole.PLATFORM_OWNER,
                UserRole.TENANT_SUPER_ADMIN,
                UserRole.COMPLIANCE_AUDITOR,
                UserRole.INTEGRATION_ADMIN,
            ],
        },
    ],
}

const platformAdminNavItem: NavItem = {
    title: "Platform Admin",
    href: "/platform-admin",
    icon: Shield,
    roles: [UserRole.PLATFORM_OWNER],
}

export function Sidebar() {
    const pathname = usePathname()
    const user = useAuthStore((state) => state.user)
    const sidebarOpen = useUIStore((state) => state.sidebarOpen)
    const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
    const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
    const toggleSidebarCollapse = useUIStore((state) => state.toggleSidebarCollapse)
    const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({})
    const [expandedAdmin, setExpandedAdmin] = useState(false)
    const [expandedOtherProjects, setExpandedOtherProjects] = useState(false)
    const [expandedReportingStudio, setExpandedReportingStudio] = useState(false)
    const [expandedPerformance, setExpandedPerformance] = useState(false)
    const [expandedCommunication, setExpandedCommunication] = useState(false)
    const [expandedPlanetAI, setExpandedPlanetAI] = useState(false)
    const [expandedProgramsProjects, setExpandedProgramsProjects] = useState(false)
    const [expandedProgramsSection, setExpandedProgramsSection] = useState(false)
    const [expandedProjectsSection, setExpandedProjectsSection] = useState(false)
    const [programs, setPrograms] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [isMounted, setIsMounted] = useState(false)

    // Hydration check
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Fetch programs and projects
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [programsRes, projectsRes] = await Promise.all([
                    fetch('/api/programs'),
                    fetch('/api/projects')
                ])

                if (programsRes.ok) {
                    const data = await programsRes.json()
                    setPrograms(data.programs || [])
                }

                if (projectsRes.ok) {
                    const data = await projectsRes.json()
                    setProjects(data.projects || [])
                }
            } catch (error) {
                console.error('Error fetching programs/projects:', error)
            }
        }

        if (user && isMounted) {
            fetchData()
        }
    }, [user, isMounted])

    // Don't render until mounted (hydrated) to prevent flash
    if (!isMounted || !user || !sidebarOpen) return null

    // Be robust if user.role isn't hydrated yet or not properly set
    const effectiveRole = (user.role && Object.values(UserRole).includes(user.role as UserRole))
        ? (user.role as UserRole)
        : UserRole.TEAM_MEMBER

    const filteredItems = navigationItems.filter((item) => {
        // Ensure roles array exists and contains the user's role
        return item.roles && Array.isArray(item.roles) && item.roles.includes(effectiveRole)
    })

    // Toggle program expansion
    const toggleProgram = (programId: string) => {
        setExpandedPrograms(prev => ({
            ...prev,
            [programId]: !prev[programId]
        }))
    }

    // Get projects for a program
    const getProjectsForProgram = (programId: string) => {
        return projects.filter(project => project.programId === programId)
    }

    // Get projects without a program
    const standaloneProjects = projects.filter(p => !p.programId)

    // Close sidebar on mobile when clicking a link
    const handleLinkClick = () => {
        if (window.innerWidth < 768) { // md breakpoint
            setSidebarOpen(false)
        }
    }

    return (
        <>
            {/* Mobile overlay backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => useUIStore.getState().setSidebarOpen(false)}
                    aria-label="Close sidebar"
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r bg-card/95 backdrop-blur-xl transition-all duration-300 shadow-sm",
                // Mobile: slide in from left, Desktop: always visible
                "md:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full",
                sidebarCollapsed ? "w-14" : "w-52"
            )}
            >
                <div className="flex h-full flex-col px-2 py-4">
                    {/* Collapse Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebarCollapse}
                        className="mb-3 ml-auto h-7 w-7 hover:bg-accent/50/50"
                        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronLeft className="h-3.5 w-3.5" />
                        )}
                    </Button>

                    {/* Main navigation - scrollable */}
                    <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
                        {filteredItems.map((item, index) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                            // Handle Programs & Projects with children
                            if (item.children && item.title === "Programs & Projects" && !sidebarCollapsed) {
                                return (
                                    <div key={item.href}>
                                        {/* Separator line between tabs */}
                                        {index > 0 && (
                                            <div className="my-1.5 border-t border-border/50"></div>
                                        )}
                                        <div
                                            className={cn(
                                                "flex items-center justify-between py-2 px-3 text-xs font-medium transition-all cursor-pointer rounded-md -mx-1",
                                                pathname.includes(item.href) || pathname.includes("/roadmap") || pathname.includes("/programs/") || pathname.includes("/projects/")
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-foreground hover:bg-accent/50/70"
                                            )}
                                            onClick={() => setExpandedProgramsProjects(!expandedProgramsProjects)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="h-3.5 w-3.5" />
                                                <span>{item.title}</span>
                                            </div>
                                            <ChevronDown
                                                className={cn(
                                                    "h-3.5 w-3.5 transition-transform flex-shrink-0",
                                                    expandedProgramsProjects && "rotate-180"
                                                )}
                                            />
                                        </div>

                                        {/* Programs & Projects children */}
                                        {expandedProgramsProjects && (
                                            <div className="space-y-1">
                                                {/* Static children - render Programs first, then Projects, then Roadmap */}
                                                {item.children
                                                    ?.filter((child) => child.roles.includes(effectiveRole))
                                                    .map((child) => {
                                                        const ChildIcon = child.icon
                                                        const isChildActive =
                                                            pathname === child.href || pathname.startsWith(child.href + "/")

                                                        // Special handling for Programs - make it expandable
                                                        if (child.title === "Programs") {
                                                            return (
                                                                <div key={child.href}>
                                                                    <div
                                                                        className={cn(
                                                                            "flex items-center justify-between py-1.5 px-3 text-xs font-medium transition-all cursor-pointer rounded-md ml-2",
                                                                            isChildActive
                                                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50/50"
                                                                        )}
                                                                        onClick={() => setExpandedProgramsSection(!expandedProgramsSection)}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <ChildIcon className="h-3.5 w-3.5" />
                                                                            {child.title}
                                                                        </div>
                                                                        <ChevronDown
                                                                            className={cn(
                                                                                "h-3 w-3 transition-transform flex-shrink-0",
                                                                                expandedProgramsSection && "rotate-180"
                                                                            )}
                                                                        />
                                                                    </div>

                                                                    {/* Programs dropdown */}
                                                                    {expandedProgramsSection && programs.length > 0 && (
                                                                        <div className="space-y-1 ml-4">
                                                                            {programs.map((program) => {
                                                                                const isProgramActive = pathname.includes(`/programs/${program.id}`)
                                                                                return (
                                                                                    <Link
                                                                                        key={program.id}
                                                                                        href={`/programs/${program.id}`}
                                                                                        onClick={handleLinkClick}
                                                                                        className={cn(
                                                                                            "flex items-center gap-2 py-2 text-sm font-medium transition-all tracking-tight -mx-2 px-10",
                                                                                            isProgramActive
                                                                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                                        )}
                                                                                    >
                                                                                        <Briefcase className="h-3 w-3" />
                                                                                        <span className="truncate">{program.name}</span>
                                                                                    </Link>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    )}

                                                                    {expandedProgramsSection && programs.length === 0 && (
                                                                        <div className="px-10 py-2 text-xs text-muted-foreground italic">
                                                                            No programs yet
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        }

                                                        // Don't render Roadmap yet, we'll render it after Projects
                                                        if (child.title === "Roadmap") {
                                                            return null
                                                        }

                                                        // Regular static children
                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={handleLinkClick}
                                                                className={cn(
                                                                    "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                                    isChildActive
                                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                            >
                                                                <ChildIcon className="h-3.5 w-3.5" />
                                                                {child.title}
                                                            </Link>
                                                        )
                                                    })}

                                                {/* Projects - always visible, links to main projects page */}
                                                <Link
                                                    href="/projects"
                                                    onClick={handleLinkClick}
                                                    className={cn(
                                                        "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                        pathname === "/projects"
                                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                    )}
                                                >
                                                    <FolderKanban className="h-3.5 w-3.5" />
                                                    <span>Projects</span>
                                                </Link>

                                                {/* Roadmap - appears last */}
                                                {item.children
                                                    ?.filter((child) => child.roles.includes(effectiveRole) && child.title === "Roadmap")
                                                    .map((child) => {
                                                        const ChildIcon = child.icon
                                                        const isChildActive =
                                                            pathname === child.href || pathname.startsWith(child.href + "/")

                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={handleLinkClick}
                                                                className={cn(
                                                                    "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                                    isChildActive
                                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                            >
                                                                <ChildIcon className="h-3.5 w-3.5" />
                                                                {child.title}
                                                            </Link>
                                                        )
                                                    })}

                                                {/* Dynamic Programs with nested Projects */}
                                                {programs.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                                                        <div className="px-10 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                            Programs
                                                        </div>
                                                        {programs.map((program) => {
                                                            const programProjects = getProjectsForProgram(program.id)
                                                            const isExpanded = expandedPrograms[program.id]
                                                            const isProgramActive = pathname.includes(`/programs/${program.id}`)

                                                            return (
                                                                <div key={program.id} className="space-y-1">
                                                                    <div
                                                                        className={cn(
                                                                            "flex items-center justify-between py-2.5 text-sm font-medium transition-all cursor-pointer tracking-tight -mx-2 px-10",
                                                                            isProgramActive && !pathname.includes('/projects/')
                                                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                        )}
                                                                        onClick={() => toggleProgram(program.id)}
                                                                    >
                                                                        <div className="flex items-center gap-2 flex-1">
                                                                            <Briefcase className="h-3.5 w-3.5" />
                                                                            <span className="truncate">{program.name}</span>
                                                                        </div>
                                                                        <ChevronDown
                                                                            className={cn(
                                                                                "h-3.5 w-3.5 transition-transform flex-shrink-0",
                                                                                isExpanded && "rotate-180",
                                                                                programProjects.length === 0 && "opacity-30"
                                                                            )}
                                                                        />
                                                                    </div>

                                                                    {/* Projects under program */}
                                                                    {isExpanded && programProjects.length > 0 && (
                                                                        <div className="ml-6 space-y-1 border-l-2 border-border pl-2">
                                                                            {programProjects.map((project) => {
                                                                                const isProjectActive = pathname.includes(`/projects/${project.id}`)
                                                                                return (
                                                                                    <Link
                                                                                        key={project.id}
                                                                                        href={`/projects/${project.id}`}
                                                                                        onClick={handleLinkClick}
                                                                                        className={cn(
                                                                                            "flex items-center gap-2 py-2 text-xs font-medium transition-all tracking-tight -mx-2 px-8",
                                                                                            isProjectActive
                                                                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-l-4 border-purple-400"
                                                                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                                        )}
                                                                                    >
                                                                                        <FolderKanban className="h-3 w-3" />
                                                                                        <span className="truncate">{project.name}</span>
                                                                                    </Link>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            // Handle Reporting Studio with children
                            if (item.children && item.title === "Reporting Studio" && !sidebarCollapsed) {
                                return (
                                    <div key={item.href}>
                                        {/* Separator line between tabs */}
                                        {index > 0 && (
                                            <div className="my-1.5 border-t border-border/50"></div>
                                        )}
                                        <div
                                            className={cn(
                                                "flex items-center justify-between py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                                pathname.includes(item.href)
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-foreground hover:bg-accent/50"
                                            )}
                                            onClick={() => setExpandedReportingStudio(!expandedReportingStudio)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </div>
                                            <ChevronDown
                                                className={cn(
                                                    "h-3.5 w-3.5 transition-transform flex-shrink-0",
                                                    expandedReportingStudio && "rotate-180"
                                                )}
                                            />
                                        </div>

                                        {/* Reporting Studio children */}
                                        {expandedReportingStudio && (
                                            <div className="space-y-1">
                                                {item.children
                                                    ?.filter((child) => child.roles.includes(effectiveRole))
                                                    .map((child) => {
                                                        const ChildIcon = child.icon
                                                        const isChildActive =
                                                            pathname === child.href || pathname.startsWith(child.href + "/")

                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={handleLinkClick}
                                                                className={cn(
                                                                    "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                                    isChildActive
                                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                            >
                                                                <ChildIcon className="h-3.5 w-3.5" />
                                                                {child.title}
                                                            </Link>
                                                        )
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            // Handle Performance with children
                            if (item.children && item.title === "Performance" && !sidebarCollapsed) {
                                return (
                                    <div key={item.href}>
                                        {/* Separator line between tabs */}
                                        {index > 0 && (
                                            <div className="my-1.5 border-t border-border/50"></div>
                                        )}
                                        <div
                                            className={cn(
                                                "flex items-center justify-between py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                                pathname.includes(item.href)
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-foreground hover:bg-accent/50"
                                            )}
                                            onClick={() => setExpandedPerformance(!expandedPerformance)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </div>
                                            <ChevronDown
                                                className={cn(
                                                    "h-3.5 w-3.5 transition-transform flex-shrink-0",
                                                    expandedPerformance && "rotate-180"
                                                )}
                                            />
                                        </div>

                                        {/* Performance children */}
                                        {expandedPerformance && (
                                            <div className="space-y-1">
                                                {item.children
                                                    ?.filter((child) => child.roles.includes(effectiveRole))
                                                    .map((child) => {
                                                        const ChildIcon = child.icon
                                                        const isChildActive =
                                                            pathname === child.href || pathname.startsWith(child.href + "/")

                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={handleLinkClick}
                                                                className={cn(
                                                                    "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                                    isChildActive
                                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                            >
                                                                <ChildIcon className="h-3.5 w-3.5" />
                                                                {child.title}
                                                            </Link>
                                                        )
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            // Handle Communication with children
                            if (item.children && item.title === "Communication" && !sidebarCollapsed) {
                                return (
                                    <div key={item.href}>
                                        {/* Separator line between tabs */}
                                        {index > 0 && (
                                            <div className="my-1.5 border-t border-border/50"></div>
                                        )}
                                        <div
                                            className={cn(
                                                "flex items-center justify-between py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                                pathname.includes(item.href)
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-foreground hover:bg-accent/50"
                                            )}
                                            onClick={() => setExpandedCommunication(!expandedCommunication)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </div>
                                            <ChevronDown
                                                className={cn(
                                                    "h-3.5 w-3.5 transition-transform flex-shrink-0",
                                                    expandedCommunication && "rotate-180"
                                                )}
                                            />
                                        </div>

                                        {/* Communication children */}
                                        {expandedCommunication && (
                                            <div className="space-y-1">
                                                {item.children
                                                    ?.filter((child) => child.roles.includes(effectiveRole))
                                                    .map((child) => {
                                                        const ChildIcon = child.icon
                                                        const isChildActive =
                                                            pathname === child.href || pathname.startsWith(child.href + "/")

                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={handleLinkClick}
                                                                className={cn(
                                                                    "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                                    isChildActive
                                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                            >
                                                                <ChildIcon className="h-3.5 w-3.5" />
                                                                {child.title}
                                                            </Link>
                                                        )
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            // Handle Planet AI with children
                            if (item.children && item.title === "Planet AI" && !sidebarCollapsed) {
                                return (
                                    <div key={item.href}>
                                        {/* Separator line between tabs */}
                                        {index > 0 && (
                                            <div className="my-1.5 border-t border-border/50"></div>
                                        )}
                                        <div
                                            className={cn(
                                                "flex items-center justify-between py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                                pathname.includes(item.href)
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-foreground hover:bg-accent/50"
                                            )}
                                            onClick={() => setExpandedPlanetAI(!expandedPlanetAI)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </div>
                                            <ChevronDown
                                                className={cn(
                                                    "h-3.5 w-3.5 transition-transform flex-shrink-0",
                                                    expandedPlanetAI && "rotate-180"
                                                )}
                                            />
                                        </div>

                                        {/* Planet AI children */}
                                        {expandedPlanetAI && (
                                            <div className="space-y-1">
                                                {item.children
                                                    ?.filter((child) => child.roles.includes(effectiveRole))
                                                    .map((child) => {
                                                        const ChildIcon = child.icon
                                                        const isChildActive =
                                                            pathname === child.href || pathname.startsWith(child.href + "/")

                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={handleLinkClick}
                                                                className={cn(
                                                                    "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                                    isChildActive
                                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                            >
                                                                <ChildIcon className="h-3.5 w-3.5" />
                                                                {child.title}
                                                            </Link>
                                                        )
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            return (
                                <div key={item.href}>
                                    {/* Separator line between tabs */}
                                    {index > 0 && (
                                        <div className="my-1.5 border-t border-border/50"></div>
                                    )}
                                    <Link
                                        href={item.href}
                                        onClick={handleLinkClick}
                                        className={cn(
                                            "flex items-center gap-2.5 py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                            sidebarCollapsed ? "justify-center" : "",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-foreground hover:bg-accent/70"
                                        )}
                                        title={sidebarCollapsed ? item.title : undefined}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {!sidebarCollapsed && item.title}
                                    </Link>
                                </div>
                            )
                        })}
                    </nav>

                    {/* Academy Tab - Between AI Assistant and Admin */}
                    {user && academyNavItem.roles.includes(effectiveRole) && (
                        <div className={cn("pt-2 border-t border-border/50/50", !sidebarCollapsed && "mt-auto")}>
                            <Link
                                href={academyNavItem.href}
                                onClick={handleLinkClick}
                                className={cn(
                                    "flex items-center gap-2.5 py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                    sidebarCollapsed ? "justify-center" : "",
                                    pathname === academyNavItem.href || pathname.startsWith(academyNavItem.href + "/")
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-foreground hover:bg-accent/70"
                                )}
                                title={sidebarCollapsed ? academyNavItem.title : undefined}
                            >
                                <GraduationCap className="h-4 w-4" />
                                {!sidebarCollapsed && <span>{academyNavItem.title}</span>}
                            </Link>
                        </div>
                    )}

                    {/* Admin Tab - Sticky at the bottom */}
                    {user && adminNavItem.roles.includes(user.role) && (
                        <div className="pt-2 border-t border-border/50">
                            {sidebarCollapsed ? (
                                <Link
                                    href={adminNavItem.href}
                                    onClick={handleLinkClick}
                                    className={cn(
                                        "flex items-center justify-center py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                        pathname.includes(adminNavItem.href)
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-foreground hover:bg-accent/50"
                                    )}
                                    title={adminNavItem.title}
                                >
                                    <Settings className="h-4 w-4" />
                                </Link>
                            ) : (
                                <>
                                    <div
                                        className={cn(
                                            "flex items-center justify-between py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                            pathname.includes(adminNavItem.href) && !pathname.includes(adminNavItem.href + "/")
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-foreground hover:bg-accent/50"
                                        )}
                                        onClick={() => setExpandedAdmin(!expandedAdmin)}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Settings className="h-4 w-4" />
                                            <span>{adminNavItem.title}</span>
                                        </div>
                                        <ChevronDown
                                            className={cn(
                                                "h-3.5 w-3.5 transition-transform flex-shrink-0",
                                                expandedAdmin && "rotate-180"
                                            )}
                                        />
                                    </div>

                                    {/* Admin children */}
                                    {expandedAdmin && (
                                        <div className="space-y-1">
                                            {adminNavItem.children
                                                ?.filter((child) => child.roles.includes(user.role))
                                                .map((child) => {
                                                    const ChildIcon = child.icon
                                                    const isChildActive =
                                                        pathname === child.href || pathname.startsWith(child.href + "/")

                                                    return (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            className={cn(
                                                                            "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                                            isChildActive
                                                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                            )}
                                                        >
                                                            <ChildIcon className="h-3.5 w-3.5" />
                                                            {child.title}
                                                        </Link>
                                                    )
                                                })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Platform Admin Tab - Last tab (god-mode) */}
                    {user && platformAdminNavItem.roles.includes(user.role) && (
                        <div className="pt-2 border-t border-border/50">
                            <Link
                                href={platformAdminNavItem.href}
                                onClick={handleLinkClick}
                                className={cn(
                                    "flex items-center gap-2.5 py-3 text-sm font-medium transition-all tracking-tight relative",
                                    sidebarCollapsed ? "justify-center px-2 rounded-md" : "-mx-2 px-6",
                                    pathname === platformAdminNavItem.href || pathname.startsWith(platformAdminNavItem.href + "/")
                                        ? sidebarCollapsed
                                            ? "bg-primary text-primary-foreground rounded-md hover:bg-primary"
                                            : "bg-primary text-primary-foreground shadow-sm"
                                        : "text-foreground hover:bg-accent/50"
                                )}
                                title={sidebarCollapsed ? platformAdminNavItem.title : undefined}
                            >
                                <Shield className="h-4 w-4" />
                                {!sidebarCollapsed && <span>{platformAdminNavItem.title}</span>}
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    )
}

