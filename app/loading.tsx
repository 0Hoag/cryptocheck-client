export default function AppLoading() {
    return (
        <main className="mx-auto min-h-[calc(100vh-12rem)] max-w-[1600px] px-4 py-8 sm:px-6" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading page</span>
            <div className="animate-pulse space-y-6">
                <div className="h-4 w-28 rounded bg-slate-800" />
                <div className="h-10 max-w-lg rounded bg-slate-800" />
                <div className="h-5 max-w-2xl rounded bg-slate-900" />
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <div className="min-h-[28rem] rounded-2xl border border-slate-800 bg-slate-950/60" />
                    <div className="space-y-5">
                        <div className="h-48 rounded-2xl border border-slate-800 bg-slate-950/60" />
                        <div className="h-56 rounded-2xl border border-slate-800 bg-slate-950/60" />
                    </div>
                </div>
            </div>
        </main>
    );
}
