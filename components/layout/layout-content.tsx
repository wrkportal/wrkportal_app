'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore, fetchAuthenticatedUser } from '@/stores/authStore'
import { Header } from './header'
import { Sidebar } from './sidebar'

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
    const { user, setUser, isHydrated } = useAuthStore()
    const [isLoadingUser, setIsLoadingUser] = useState(true)

    // Fetch user on mount if not already loaded
    useEffect(() => {
        const loadUser = async () => {
            if (!isHydrated) {
                return
            }

            // If user is already in store, we're done
            if (user) {
                setIsLoadingUser(false)
                return
            }

            // Try to fetch user
            try {
                const fetchedUser = await fetchAuthenticatedUser(true)
                if (fetchedUser) {
                    setUser(fetchedUser)
                }
                // If fetchedUser is null, that's OK - user is just not logged in
                // Don't treat this as an error
            } catch (error: any) {
                // Only log actual errors, not 401 responses
                if (error?.status !== 401) {
                    console.error('Error loading user:', error)
                }
            } finally {
                setIsLoadingUser(false)
            }
        }

        loadUser()
    }, [isHydrated, user, setUser])

    // Check if current page is an auth page or public marketing page
    const isAuthPage =
        pathname === '/' ||
        pathname?.startsWith('/login') ||
        pathname?.startsWith('/signup') ||
        pathname?.startsWith('/forgot-password') ||
        pathname?.startsWith('/verify-email') ||
        pathname?.startsWith('/reset-password') ||
        pathname?.startsWith('/landing') ||
        pathname?.startsWith('/terms') ||
        pathname?.startsWith('/privacy') ||
        pathname?.startsWith('/security')

    // Check if current page is a dashboard page (full-width layout)
    const isDashboardPage =
        pathname?.startsWith('/wrkboard') ||
        pathname?.startsWith('/finance-dashboard') ||
        pathname?.startsWith('/workflows/finance') ||
        pathname?.startsWith('/product-management') ||
        pathname?.startsWith('/projects') ||
        pathname?.startsWith('/roadmap') ||
        pathname?.startsWith('/releases') ||
        pathname?.startsWith('/sprints') ||
        pathname?.startsWith('/backlog') ||
        pathname?.startsWith('/dependencies') ||
        pathname?.startsWith('/teams') ||
        pathname?.startsWith('/operations-dashboard') ||
        pathname?.startsWith('/developer-dashboard') ||
        pathname?.startsWith('/it-dashboard') ||
        pathname?.startsWith('/customer-service-dashboard') ||
        pathname?.startsWith('/recruitment-dashboard') ||
        pathname?.startsWith('/sales-dashboard') ||
        pathname?.startsWith('/reporting-engine') ||
        pathname?.startsWith('/collaborate')

    // Redirect logged-in users from root path to /wrkboard
    useEffect(() => {
        if (user && pathname === '/' && router) {
            router.push('/wrkboard')
        }
    }, [user, pathname, router])

    // For auth pages and public pages, render without header/sidebar
    if (isAuthPage) {
        return <>{children}</>
    }

    // Don't render header/sidebar until auth is confirmed
    // This prevents navbar flash on public pages
    if (!isHydrated || isLoadingUser) {
        // Show nothing while loading - prevents FOUC
        return null
    }

    // Only show header/sidebar for authenticated users
    if (!user) {
        // User is not authenticated, render without header/sidebar
        return <>{children}</>
    }

    // ================= DASHBOARD PAGES =================
    if (isDashboardPage) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <Sidebar />

                <main
                    className={`transition-all duration-300 pt-16 h-screen overflow-hidden ${
                        sidebarCollapsed ? 'md:pl-14' : 'md:pl-56'
                    }`}
                >
                    <div className="h-full w-full">
                        {children}
                    </div>
                </main>
            </div>
        )
    }

    // ================= REGULAR PAGES (Authenticated only) =================
    // At this point, user is authenticated
    return (
        <div className="flex min-h-screen flex-col">
            <Header />

            <div className="flex flex-1">
                <Sidebar />

                <div
                    className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'md:pl-14' : 'md:pl-56'
                        }`}
                    style={{ height: 'calc(100vh - 4rem)' }}
                >
                    <main className="h-full overflow-y-auto">
                        <div className="h-full p-4 sm:p-6 md:p-8 lg:p-12 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
                            <div className="mx-auto h-full max-w-7xl">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
