export default function SettingsLoading() {
    return (
        <div className="p-6 space-y-6">
            <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
            <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border bg-card p-4">
                        <div className="space-y-2">
                            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                            <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                        </div>
                        <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
                    </div>
                ))}
            </div>
        </div>
    )
}
