'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { Header } from './header'
import { Sidebar } from './sidebar'

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
    const user = useAuthStore((state) => state.user)

    // Check if current page is an auth page or public marketing page
    const isAuthPage = pathname?.startsWith('/login') ||
        pathname?.startsWith('/signup') ||
        pathname?.startsWith('/forgot-password') ||
        pathname?.startsWith('/verify-email') ||
        pathname?.startsWith('/reset-password') ||
        pathname?.startsWith('/landing')

    // Redirect logged-in users from root path to /my-work
    useEffect(() => {
        if (user && pathname === '/') {
            router.push('/my-work')
        }
    }, [user, pathname, router])

    // For auth pages, render without header/sidebar
    if (isAuthPage) {
        return <>{children}</>
    }

    // For regular pages, render with header/sidebar
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex flex-1">
                <Sidebar />
                <main
                    className={`flex-1 overflow-y-auto p-4 md:p-8 mt-16 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
                        }`}
                >
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

