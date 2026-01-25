'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore, fetchAuthenticatedUser } from "@/stores/authStore"

export default function HomePage() {
    const router = useRouter()
    const { user, setUser, isHydrated } = useAuthStore()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        const checkUserAndRedirect = async () => {
            if (!isHydrated) {
                return // Wait for store to hydrate
            }

            // Add a small delay to allow session to be established after OAuth redirect
            await new Promise(resolve => setTimeout(resolve, 500))

            // Add timeout to prevent infinite loading
            const timeoutId = setTimeout(() => {
                console.warn('[HomePage] Timeout waiting for user, redirecting to landing page')
                setIsChecking(false)
                router.replace('/landing')
            }, 15000) // 15 second timeout (increased for retries)

            let authenticatedUser = null
            let retries = 0
            const maxRetries = 5
            const retryDelay = 1000 // Start with 1 second

            while (retries < maxRetries && !authenticatedUser) {
                try {
                    console.log(`[HomePage] Attempting to fetch user (attempt ${retries + 1}/${maxRetries})...`)
                    // Always fetch fresh user data from API to avoid cache issues
                    authenticatedUser = await fetchAuthenticatedUser(true) // Force refresh

                    if (authenticatedUser) {
                        clearTimeout(timeoutId) // Clear timeout if we got a response
                        // Update store with fresh data
                        setUser(authenticatedUser)

                        // Redirect to wrkboard (no role selection required)
                        console.log('[HomePage] ✅ User authenticated, redirecting to wrkboard')
                        window.location.href = '/wrkboard'
                        return // Exit early on success
                    } else {
                        // If no user found, wait and retry (session might still be establishing)
                        if (retries < maxRetries - 1) {
                            console.log(`[HomePage] No user found, retrying in ${retryDelay * (retries + 1)}ms...`)
                            await new Promise(resolve => setTimeout(resolve, retryDelay * (retries + 1)))
                            retries++
                        } else {
                            // Last retry failed, redirect to landing
                            console.warn('[HomePage] All retries exhausted, redirecting to landing page')
                            clearTimeout(timeoutId)
                            router.replace('/landing')
                            setIsChecking(false)
                            return
                        }
                    }
                } catch (error) {
                    console.error(`[HomePage] Error checking user (attempt ${retries + 1}):`, error)
                    
                    // If it's a network error or 401, retry
                    if (retries < maxRetries - 1 && (error instanceof TypeError || (error as any)?.status === 401)) {
                        console.log(`[HomePage] Retrying after error in ${retryDelay * (retries + 1)}ms...`)
                        await new Promise(resolve => setTimeout(resolve, retryDelay * (retries + 1)))
                        retries++
                    } else {
                        // Fatal error or max retries reached
                        clearTimeout(timeoutId)
                        router.replace('/landing')
                        setIsChecking(false)
                        return
                    }
                }
            }
        }

        checkUserAndRedirect()
    }, [isHydrated, router, setUser])

    // Show loading while checking authentication
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
}
