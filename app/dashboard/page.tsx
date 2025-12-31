'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to project dashboard
        router.replace('/projects/dashboard')
    }, [router])

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading dashboard...</p>
            </div>
        </div>
    )
}

