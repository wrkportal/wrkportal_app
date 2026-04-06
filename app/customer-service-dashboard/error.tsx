'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function CustomerServiceError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[CustomerServiceError]', error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">
                    Failed to load Customer Service
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    There was an issue loading the customer service module. Please try again.
                </p>
            </div>
            <Button onClick={reset}>Try again</Button>
        </div>
    )
}
