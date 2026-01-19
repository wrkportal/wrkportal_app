'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { AIDataQueryWidget } from '@/components/ai/ai-data-query-widget'

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
    const user = useAuthStore((state) => state.user)

    // Check if current page is an auth page or public marketing page
    const isAuthPage =
        pathname?.startsWith('/login') ||
        pathname?.startsWith('/signup') ||
        pathname?.startsWith('/forgot-password') ||
        pathname?.startsWith('/verify-email') ||
        pathname?.startsWith('/reset-password') ||
        pathname?.startsWith('/landing')

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
        if (user && pathname === '/') {
            router.push('/wrkboard')
        }
    }, [user, pathname, router])

    // For auth pages, render without header/sidebar
    if (isAuthPage) {
        return <>{children}</>
    }

    // ================= DASHBOARD PAGES =================
    if (isDashboardPage) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <Sidebar />

                <main
                    className={`transition-all duration-300 pt-16 h-screen ${
                        sidebarCollapsed ? 'md:pl-14' : 'md:pl-56'
                    }`}
                >
                    {children}
                </main>
                {user && <AIDataQueryWidget />}
            </div>
        )
    }

    // ================= REGULAR PAGES =================
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
            {user && <AIDataQueryWidget />}
        </div>
    )
}
