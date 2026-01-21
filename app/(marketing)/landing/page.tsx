// Redirect to root for backward compatibility
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingRedirect() {
    const router = useRouter()
    
    useEffect(() => {
        router.replace('/')
    }, [router])
    
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <p className="text-muted-foreground">Redirecting...</p>
            </div>
        </div>
    )
}
