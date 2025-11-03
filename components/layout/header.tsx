'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
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
import { Bell, Menu, Search, Settings, LogOut, User, Mail } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function Header() {
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const toggleSidebar = useUIStore((state) => state.toggleSidebar)
    const router = useRouter()
    const [alertsCount, setAlertsCount] = useState(0)

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
            }
        } catch (error) {
            console.error('Error fetching alerts count:', error)
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

    if (!user) return null

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
            <div className="flex h-16 items-center gap-4 px-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="md:hidden"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <Link href="/" className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <span className="text-lg font-semibold">MB</span>
                    </div>
                    <span className="hidden font-semibold text-lg sm:inline-block">
                        ManagerBook
                    </span>
                </Link>

                <div className="flex flex-1 items-center justify-between space-x-2 md:space-x-4 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none md:max-w-2xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-9 h-9 text-sm"
                                onClick={() => router.push("/search")}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        
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
                    </div>
                </div>
            </div>
        </header>
    )
}

