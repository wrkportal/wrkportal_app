export default function FinanceLoading() {
    return (
        <div className="p-6 space-y-6">
            <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-6">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" />
                    </div>
                ))}
            </div>
            <div className="rounded-lg border bg-card p-6 space-y-4">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
                ))}
            </div>
        </div>
    )
}
