export default function WrkboardLoading() {
    return (
        <div className="p-6 space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
                <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-6">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" />
                    </div>
                ))}
            </div>

            {/* Content area skeleton */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
                        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                        {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="flex items-center gap-3">
                                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
