'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function RecruitmentError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[RecruitmentError]', error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">
                    Failed to load Recruitment
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    There was an issue loading the recruitment module. Please try again.
                </p>
            </div>
            <Button onClick={reset}>Try again</Button>
        </div>
    )
}
