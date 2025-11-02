'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"

export default function HomePage() {
    const router = useRouter()
    const user = useAuthStore((state) => state.user)

    // If user is logged in, redirect to their workspace
    useEffect(() => {
        if (user) {
            router.push('/my-work')
        } else {
            router.push('/landing')
        }
    }, [user, router])

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
}

