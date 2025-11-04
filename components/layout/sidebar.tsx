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
        title: "Roadmap",
        href: "/roadmap",
        icon: Map,
        roles: Object.values(UserRole),
    },
    {
        title: "AI Tools",
        href: "/ai-tools",
        icon: Sparkles,
        roles: Object.values(UserRole),
    },
    {
        title: "Goals & OKRs",
        href: "/okrs",
        icon: Target,
        roles: [
            UserRole.TENANT_SUPER_ADMIN,
            UserRole.ORG_ADMIN,
            UserRole.PMO_LEAD,
            UserRole.PROJECT_MANAGER,
            UserRole.TEAM_MEMBER,
            UserRole.EXECUTIVE,
        ],
    },
    {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
        roles: [
            UserRole.TENANT_SUPER_ADMIN,
            UserRole.ORG_ADMIN,
            UserRole.PMO_LEAD,
            UserRole.PROJECT_MANAGER,
            UserRole.EXECUTIVE,
            UserRole.RESOURCE_MANAGER,
            UserRole.FINANCE_CONTROLLER,
        ],
    },
    {
        title: "Approvals",
        href: "/approvals",
        icon: CheckSquare,
        roles: [
            UserRole.TENANT_SUPER_ADMIN,
            UserRole.ORG_ADMIN,
            UserRole.PMO_LEAD,
            UserRole.PROJECT_MANAGER,
            UserRole.EXECUTIVE,
        ],
    },
]

const aiAssistantNavItem: NavItem = {
    title: "AI Assistant",
    href: "/ai-assistant",
    icon: Bot,
    roles: Object.values(UserRole),
}

const academyNavItem: NavItem = {
    title: "Academy",
    href: "/academy",
    icon: GraduationCap,
    roles: Object.values(UserRole),
}

const adminNavItem: NavItem = {
    title: "Admin",
    href: "/admin",
    icon: Settings,
    roles: [UserRole.TENANT_SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.INTEGRATION_ADMIN],
    children: [
        {
            title: "Organization",
            href: "/admin/organization",
            icon: Users,
            roles: [UserRole.TENANT_SUPER_ADMIN, UserRole.ORG_ADMIN],
        },
        {
            title: "Tutorials",
            href: "/admin/tutorials",
            icon: GraduationCap,
            roles: [UserRole.TENANT_SUPER_ADMIN],
        },
        {
            title: "SSO Settings",
            href: "/admin/sso-settings",
            icon: Shield,
            roles: [UserRole.TENANT_SUPER_ADMIN, UserRole.ORG_ADMIN],
        },
        {
            title: "Security",
            href: "/admin/security",
            icon: Shield,
            roles: [UserRole.TENANT_SUPER_ADMIN],
        },
        {
            title: "Audit Log",
            href: "/admin/audit",
            icon: FileText,
            roles: [
                UserRole.TENANT_SUPER_ADMIN,
                UserRole.COMPLIANCE_AUDITOR,
                UserRole.INTEGRATION_ADMIN,
            ],
        },
    ],
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
                "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r bg-card backdrop-blur-lg transition-all duration-300",
                // Mobile: slide in from left, Desktop: always visible
                "md:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full",
                sidebarCollapsed ? "w-16" : "w-64"
            )}
            >
                <div className="flex h-full flex-col px-2 py-6">
                    {/* Collapse Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebarCollapse}
                        className="mb-2 ml-auto"
                        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="h-5 w-5" />
                        ) : (
                            <ChevronLeft className="h-5 w-5" />
                        )}
                    </Button>

                    {/* Main navigation - scrollable */}
                    <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
                        {filteredItems.map((item, index) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                            return (
                                <div key={item.href}>
                                    {/* Separator line between tabs */}
                                    {index > 0 && (
                                        <div className="my-2 border-t border-border"></div>
                                    )}
                                    <Link
                                        href={item.href}
                                        onClick={handleLinkClick}
                                        className={cn(
                                            "flex items-center gap-3 py-3 text-sm font-medium transition-all tracking-tight relative",
                                            sidebarCollapsed ? "justify-center px-2 rounded-md hover:bg-accent" : "-mx-2 px-6 hover:bg-accent",
                                            isActive
                                                ? sidebarCollapsed
                                                    ? "bg-primary text-primary-foreground rounded-md"
                                                    : "bg-primary text-primary-foreground"
                                                : "text-foreground"
                                        )}
                                        title={sidebarCollapsed ? item.title : undefined}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {!sidebarCollapsed && item.title}
                                    </Link>
                                </div>
                            )
                        })}

                        {/* Programs with nested Projects */}
                        {!sidebarCollapsed && (
                            <div className="space-y-1 pt-2">
                                {/* Separator line before Programs */}
                                <div className="my-2 border-t border-border"></div>

                                <div className="flex items-center justify-between py-3 text-sm font-medium transition-all cursor-pointer tracking-tight -mx-2 px-6 text-foreground hover:bg-accent">
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="h-5 w-5" />
                                        <span>Programs & Projects</span>
                                    </div>
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
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                                )}
                                                onClick={() => toggleProgram(program.id)}
                                            >
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Briefcase className="h-4 w-4" />
                                                    <span className="truncate">{program.name}</span>
                                                </div>
                                                <ChevronDown
                                                    className={cn(
                                                        "h-4 w-4 transition-transform flex-shrink-0",
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
                                                                className={cn(
                                                                    "flex items-center gap-2 py-2 text-xs font-medium transition-all tracking-tight -mx-2 px-8",
                                                                    isProjectActive
                                                                        ? "bg-primary text-primary-foreground border-l-4 border-primary/50"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
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

                                {/* Standalone Projects (no program) with dropdown */}
                                {standaloneProjects.length > 0 && (
                                    <div className="space-y-1 mt-2 border-t border-border pt-2">
                                        <div
                                            className={cn(
                                                "flex items-center justify-between py-3 text-sm font-medium transition-all cursor-pointer tracking-tight -mx-2 px-10 text-foreground hover:bg-accent"
                                            )}
                                            onClick={() => setExpandedOtherProjects(!expandedOtherProjects)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FolderKanban className="h-5 w-5" />
                                                <span>Other Projects</span>
                                            </div>
                                            <ChevronDown
                                                className={cn(
                                                    "h-4 w-4 transition-transform flex-shrink-0",
                                                    expandedOtherProjects && "rotate-180"
                                                )}
                                            />
                                        </div>
                                        {expandedOtherProjects && standaloneProjects.map((project) => {
                                            const isProjectActive = pathname.includes(`/projects/${project.id}`)
                                            return (
                                                <Link
                                                    key={project.id}
                                                    href={`/projects/${project.id}`}
                                                    className={cn(
                                                        "flex items-center gap-2 py-2 text-xs font-medium transition-all tracking-tight -mx-2 px-14",
                                                        isProjectActive
                                                            ? "bg-primary text-primary-foreground border-l-4 border-primary/50"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
                        )}
                    </nav>

                    {/* AI Assistant Tab - Above Admin */}
                    {!sidebarCollapsed && user && aiAssistantNavItem.roles.includes(effectiveRole) && (
                        <div className="mt-auto pt-2 border-t border-border">
                            <Link
                                href={aiAssistantNavItem.href}
                                onClick={handleLinkClick}
                                className={cn(
                                    "flex items-center gap-3 py-3 text-sm font-medium transition-all tracking-tight -mx-2 px-6",
                                    pathname === aiAssistantNavItem.href || pathname.startsWith(aiAssistantNavItem.href + "/")
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground hover:bg-accent"
                                )}
                            >
                                <Bot className="h-5 w-5" />
                                <span>{aiAssistantNavItem.title}</span>
                            </Link>
                        </div>
                    )}

                    {/* Academy Tab - Between AI Assistant and Admin */}
                    {!sidebarCollapsed && user && academyNavItem.roles.includes(effectiveRole) && (
                        <div className="pt-2 border-t border-border">
                            <Link
                                href={academyNavItem.href}
                                onClick={handleLinkClick}
                                className={cn(
                                    "flex items-center gap-3 py-3 text-sm font-medium transition-all tracking-tight -mx-2 px-6",
                                    pathname === academyNavItem.href || pathname.startsWith(academyNavItem.href + "/")
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground hover:bg-accent"
                                )}
                            >
                                <GraduationCap className="h-5 w-5" />
                                <span>{academyNavItem.title}</span>
                            </Link>
                        </div>
                    )}

                    {/* Admin Tab - Sticky at the bottom */}
                    {!sidebarCollapsed && user && adminNavItem.roles.includes(user.role) && (
                        <div className="pt-2 border-t border-border">
                            <div
                                className={cn(
                                    "flex items-center justify-between py-3 text-sm font-medium transition-all cursor-pointer tracking-tight -mx-2 px-6",
                                    pathname.includes(adminNavItem.href) && !pathname.includes(adminNavItem.href + "/")
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground hover:bg-accent"
                                )}
                                onClick={() => setExpandedAdmin(!expandedAdmin)}
                            >
                                <div className="flex items-center gap-3">
                                    <Settings className="h-5 w-5" />
                                    <span>{adminNavItem.title}</span>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        "h-4 w-4 transition-transform flex-shrink-0",
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
                                                        "flex items-center gap-3 py-2.5 text-sm font-medium transition-all tracking-tight -mx-2 px-10",
                                                        isChildActive
                                                            ? "bg-primary text-primary-foreground"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                                    )}
                                                >
                                                    <ChildIcon className="h-4 w-4" />
                                                    {child.title}
                                                </Link>
                                            )
                                        })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </>
    )
}

