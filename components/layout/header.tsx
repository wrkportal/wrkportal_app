'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/stores/authStore"
import { useUIStore } from "@/stores/uiStore"
import { Bell, Menu, Settings, LogOut, User, UserPlus, Moon, Sun, Brain } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { SearchBar } from "@/components/layout/search-bar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { InviteUserModal } from "@/components/invite-user-modal"
import { canInviteUsers } from "@/lib/permissions"
import { WorkspaceType, UserRole, GroupRole } from "@/types"
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher"

export function Header() {
    const { user, isHydrated } = useAuthStore((state) => ({ user: state.user, isHydrated: state.isHydrated }))
    const logout = useAuthStore((state) => state.logout)
    const toggleSidebar = useUIStore((state) => state.toggleSidebar)
    const router = useRouter()
    const [alertsCount, setAlertsCount] = useState(0)
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
    
    // Show user profile once hydrated (even if user is still loading)
    const showUserProfile = isHydrated && user !== null

    // Fetch alerts count
    useEffect(() => {
        if (user) {
            fetchAlertsCount()
            // Refresh count every 30 seconds
            const interval = setInterval(fetchAlertsCount, 30000)
            return () => clearInterval(interval)
        }
    }, [user])

    const fetchAlertsCount = async () => {
        try {
            const response = await fetch('/api/notifications/count')
            if (response.ok) {
                const data = await response.json()
                setAlertsCount(data.count || 0)
            } else {
                // Silently handle errors - notification system might not be set up
                setAlertsCount(0)
            }
        } catch (error) {
            // Silently handle errors - notification system might not be set up
            setAlertsCount(0)
        }
    }

    // Theme management
    useEffect(() => {
        const root = window.document.documentElement
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
        
        if (savedTheme) {
            setTheme(savedTheme)
        }

        const applyTheme = (currentTheme: 'light' | 'dark' | 'system') => {
            root.classList.remove('light', 'dark')

            if (currentTheme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light'
                root.classList.add(systemTheme)
            } else {
                root.classList.add(currentTheme)
            }
        }

        applyTheme(savedTheme || 'system')

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system')
            }
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme])

    const setAndSaveTheme = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)

        const root = window.document.documentElement
        root.classList.remove('light', 'dark')

        if (newTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
            root.classList.add(systemTheme)
        } else {
            root.classList.add(newTheme)
        }
    }

    const handleLogout = async () => {
        try {
            // Clear local state first
            logout()

            // Then sign out with NextAuth
            await signOut({
                redirect: true,
                callbackUrl: '/login'
            })
        } catch (error) {
            console.error('Logout error:', error)
            // Even if signOut fails, redirect to login
            if (router) {
                router.push('/login')
            }
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-16 items-center gap-4 px-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="md:hidden"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <Link href="/" className="flex items-center shrink-0">
                    <Image 
                        src="/logo.png" 
                        alt="wrkportal.com" 
                        width={140} 
                        height={40}
                        className="h-8 w-auto"
                        priority
                        unoptimized
                    />
                </Link>

                {/* Workspace Switcher - Show if user has multiple tenants */}
                {showUserProfile && user && (
                    <div className="hidden md:block">
                        <WorkspaceSwitcher />
                    </div>
                )}

                {/* Centered Search Bar */}
                <div className="flex-1 flex justify-center px-4">
                    <SearchBar />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {/* Invite Button - + icon - Show for all logged-in users, API will handle permissions */}
                    {user && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => setInviteModalOpen(true)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9"
                                        aria-label="Invite user"
                                    >
                                        <span className="text-lg font-semibold">+</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Invite People</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    
                    {/* AI Assistant Button */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => {
                                        if (!router) {
                                            console.error('[Header] Router not available')
                                            return
                                        }
                                        router.push("/ai-assistant")
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9"
                                    aria-label="AI Assistant"
                                >
                                    <Brain className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>AI Assistant</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    
                    {showUserProfile && user ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (!router) {
                                        console.error('[Header] Router not available')
                                        return
                                    }
                                    router.push("/notifications")
                                }}
                                className="relative h-9 w-9"
                                title={`${alertsCount} notification(s)`}
                            >
                                <Bell className="h-[1.2rem] w-[1.2rem]" />
                                {alertsCount > 0 && (
                                    <>
                                        <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                            {alertsCount > 9 ? '9+' : alertsCount}
                                        </span>
                                    </>
                                )}
                                <span className="sr-only">Notifications ({alertsCount})</span>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        className="relative h-9 w-9 rounded-full hover:bg-accent focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        aria-label="User menu"
                                    >
                                        <Avatar className="h-9 w-9 ring-2 ring-background">
                                            <AvatarImage 
                                                src={user.avatar} 
                                                alt={`${user.firstName} ${user.lastName}`} 
                                                className="opacity-100 object-cover" 
                                            />
                                            <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm opacity-100">
                                                {getInitials(user.firstName, user.lastName)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 z-[100]" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.role.replace(/_/g, " ")}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => {
                                        if (!router) {
                                            console.error('[Header] Router not available')
                                            return
                                        }
                                        router.push("/profile")
                                    }}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        if (!router) {
                                            console.error('[Header] Router not available')
                                            return
                                        }
                                        router.push("/settings")
                                    }}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Theme</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => setAndSaveTheme('light')}>
                                        <Sun className="mr-2 h-4 w-4" />
                                        <span>Light</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setAndSaveTheme('dark')}>
                                        <Moon className="mr-2 h-4 w-4" />
                                        <span>Dark</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setAndSaveTheme('system')}>
                                        <span className="mr-2 h-4 w-4 inline-flex items-center justify-center">💻</span>
                                        <span>System</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        // Loading state - placeholder to prevent layout shift
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Invite User Modal */}
            <InviteUserModal
                open={inviteModalOpen}
                onOpenChange={setInviteModalOpen}
            />
        </header>
    )
}

