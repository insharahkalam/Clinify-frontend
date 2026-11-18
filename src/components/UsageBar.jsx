export default function UsageBar({ used, limit, label = "Patients" }) {
    const unlimited = limit == null;
    const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
    const near = !unlimited && pct >= 90;

    return (
        <div>
            <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="text-ink/60">{label}</span>
                <span className="font-semibold">
                    {used}
                    {unlimited ? " (unlimited)" : ` / ${limit}`}
                </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-page ring-1 ring-line">
                <div
                    className={`h-full rounded-full transition-all ${near ? "bg-amber-400" : "bg-primary"}`}
                    style={{ width: unlimited ? "100%" : `${pct}%`, opacity: unlimited ? 0.35 : 1 }}
                />
            </div>
            {near && <p className="mt-2 text-xs text-amber-700">Limit qareeb hai, Pro plan mein upgrade karein.</p>}
        </div>
    );
}