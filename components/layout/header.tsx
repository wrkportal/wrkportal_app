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
import { Bell, Menu, Settings, LogOut, User, UserPlus } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { FeedbackButton } from "@/components/feedback/feedback-button"
import { HelpDialog } from "@/components/help/help-dialog"
import { SearchBar } from "@/components/layout/search-bar"
import { AIDataQueryWidget } from "@/components/ai/ai-data-query-widget"
import { InviteUserModal } from "@/components/invite-user-modal"
import { canInviteUsers } from "@/lib/permissions"
import { WorkspaceType, UserRole, GroupRole } from "@/types"

export function Header() {
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const toggleSidebar = useUIStore((state) => state.toggleSidebar)
    const router = useRouter()
    const [alertsCount, setAlertsCount] = useState(0)
    const [inviteModalOpen, setInviteModalOpen] = useState(false)

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
            router.push('/login')
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

                <Link href="/" className="flex items-center space-x-2 shrink-0">
                    <Image 
                        src="/logo.png" 
                        alt="wrkportal.com" 
                        width={140} 
                        height={40}
                        className="h-8 w-auto"
                        priority
                    />
                    <span className="text-lg font-semibold text-foreground hidden sm:inline-block">
                        wrkportal.com
                    </span>
                </Link>

                {/* Centered Search Bar */}
                <div className="flex-1 flex justify-center px-4">
                    <SearchBar />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <ThemeToggle />
                    <FeedbackButton />
                    <HelpDialog />
                    
                    {/* Invite Button */}
                    {user && canInviteUsers(
                        WorkspaceType.ORGANIZATION, // Default to organization, actual check happens in API
                        user?.role as UserRole,
                        user?.groupRole as GroupRole | undefined
                    ) && (
                        <Button
                            onClick={() => setInviteModalOpen(true)}
                            variant="outline"
                            size="sm"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite
                        </Button>
                    )}
                    
                    {user ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push("/notifications")}
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
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar} alt={user.firstName} />
                                            <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm">
                                                {getInitials(user.firstName, user.lastName)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
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
                                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
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

