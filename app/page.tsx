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

            // Always fetch fresh user data from API to avoid cache issues
            const authenticatedUser = await fetchAuthenticatedUser(true) // Force refresh
            
            if (authenticatedUser) {
                // Update store with fresh data
                setUser(authenticatedUser)
                
                // Check if user has selected a role previously
                const hasSelectedRole = authenticatedUser.primaryWorkflowType && 
                                       authenticatedUser.primaryWorkflowType !== null && 
                                       authenticatedUser.primaryWorkflowType !== '' &&
                                       authenticatedUser.primaryWorkflowType !== undefined
                
                if (!hasSelectedRole) {
                    // User hasn't selected a role - redirect to role selection
                    window.location.href = '/onboarding/role-selection'
                    return
                }
                
                // User has completed onboarding - redirect to their landing page
                const landingPage = authenticatedUser.landingPage || '/wrkboard'
                window.location.href = landingPage
            } else {
                // Not logged in - redirect to landing page which now shows at root
                // Since landing page is now at /landing and root will show it
                router.replace('/landing')
            }
            
            setIsChecking(false)
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
