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
            console.log('[HomePage] Starting check - will redirect to my-work page if authenticated...', { isHydrated })
            
            if (!isHydrated) {
                console.log('[HomePage] Waiting for hydration...')
                return // Wait for store to hydrate
            }

            console.log('[HomePage] Fetching user from API...')
            // Always fetch fresh user data from API to avoid cache issues
            // Don't rely on cached store data
            const authenticatedUser = await fetchAuthenticatedUser(true) // Force refresh
            
            console.log('[HomePage] User fetch result:', {
                hasUser: !!authenticatedUser,
                email: authenticatedUser?.email,
                primaryWorkflowType: authenticatedUser?.primaryWorkflowType,
                landingPage: authenticatedUser?.landingPage,
                role: authenticatedUser?.role
            })
            
            if (authenticatedUser) {
                // Update store with fresh data
                setUser(authenticatedUser)
                
                // Check if user has selected a role previously
                // If primaryWorkflowType is not set, it means they haven't selected a role yet
                const hasSelectedRole = authenticatedUser.primaryWorkflowType && 
                                       authenticatedUser.primaryWorkflowType !== null && 
                                       authenticatedUser.primaryWorkflowType !== '' &&
                                       authenticatedUser.primaryWorkflowType !== undefined
                
                console.log('[HomePage] Role selection check:', {
                    email: authenticatedUser.email,
                    primaryWorkflowType: authenticatedUser.primaryWorkflowType,
                    primaryWorkflowTypeType: typeof authenticatedUser.primaryWorkflowType,
                    landingPage: authenticatedUser.landingPage,
                    hasSelectedRole,
                    willRedirectToRoleSelection: !hasSelectedRole
                })
                
                if (!hasSelectedRole) {
                    // User hasn't selected a role - redirect to role selection
                    console.log('[HomePage] ❌ User has NOT selected a role, redirecting to role selection')
                    console.log('[HomePage] Redirecting to /onboarding/role-selection')
                    // Use window.location for hard redirect to ensure it works
                    window.location.href = '/onboarding/role-selection'
                    return
                }
                
                // User has completed onboarding - redirect to their landing page (usually /wrkboard)
                const landingPage = authenticatedUser.landingPage || '/wrkboard'
                console.log('[HomePage] ✅ User has selected role, redirecting to wrkboard page (or custom landing):', landingPage)
                // Only redirect if we're on the home page (not already on the landing page)
                if (window.location.pathname === '/') {
                  window.location.href = landingPage
                }
            } else {
                // Not logged in - redirect to landing page
                console.log('[HomePage] No authenticated user, redirecting to landing')
                router.push('/landing')
            }
            
            setIsChecking(false)
        }

        checkUserAndRedirect()
    }, [isHydrated, router, setUser]) // Removed 'user' from dependencies to always fetch fresh

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
}

