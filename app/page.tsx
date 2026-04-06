'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore, fetchAuthenticatedUser } from "@/stores/authStore"

export default function HomePage() {
    const router = useRouter()
    const { user, setUser, isHydrated } = useAuthStore()

    useEffect(() => {
        const checkUserAndRedirect = async () => {
            if (!isHydrated) {
                return
            }

            // If user is already in store from a previous session, redirect immediately
            if (user) {
                router.replace('/wrkboard')
                return
            }

            // Fetch with a generous timeout (10s) to handle Aurora cold starts
            try {
                const authenticatedUser = await Promise.race([
                    fetchAuthenticatedUser(true),
                    new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000))
                ])

                if (authenticatedUser) {
                    setUser(authenticatedUser)
                    router.replace('/wrkboard')
                } else {
                    router.replace('/landing')
                }
            } catch (error) {
                router.replace('/landing')
            }
        }

        checkUserAndRedirect()
    }, [isHydrated, user, router, setUser])

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
}
