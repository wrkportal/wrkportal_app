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
                return // Wait for store to hydrate
            }

            // Quick authentication check with 1 second timeout
            try {
                const authenticatedUser = await Promise.race([
                    fetchAuthenticatedUser(true),
                    new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000))
                ])

                if (authenticatedUser) {
                    setUser(authenticatedUser)
                    router.replace('/wrkboard')
                } else {
                    // No user found, redirect to landing immediately
                    router.replace('/landing')
                }
            } catch (error) {
                // On any error, redirect to landing immediately
                router.replace('/landing')
            }
        }

        checkUserAndRedirect()
    }, [isHydrated, router, setUser])

    // Show minimal loading or redirect immediately
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
}
