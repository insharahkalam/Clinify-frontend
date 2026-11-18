export default function Stat({ label, value, icon: Icon, hint }) {
    return (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-secondary/60 text-primary-dark">
                <Icon size={20} />
            </div>
            <p className="text-sm text-ink/60">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
        </div>
    );
}