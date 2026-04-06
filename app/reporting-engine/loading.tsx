export default function ReportingLoading() {
    return (
        <div className="p-6 space-y-6">
            <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        <div className="h-32 w-full animate-pulse rounded bg-muted" />
                    </div>
                ))}
            </div>
        </div>
    )
}
