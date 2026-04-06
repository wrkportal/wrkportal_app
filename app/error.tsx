'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[GlobalError]', error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground">
                    Something went wrong
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    An unexpected error occurred. Please try again.
                </p>
                {error.digest && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
            <div className="flex gap-3">
                <Button onClick={reset} variant="default">
                    Try again
                </Button>
                <Button
                    onClick={() => (window.location.href = '/wrkboard')}
                    variant="outline"
                >
                    Go to Dashboard
                </Button>
            </div>
        </div>
    )
}
