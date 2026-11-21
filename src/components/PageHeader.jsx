export default function PageHeader({ title, subtitle, action, icon: Icon }) {
    return (
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-line bg-white px-6 py-5 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
            {/* soft decorative glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-secondary/40 blur-3xl" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-secondary" />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                    {Icon && (
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-secondary/40 text-primary-dark">
                            <Icon size={22} />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-bold tracking-tight text-ink sm:text-[1.7rem]">{title}</h1>
                        {subtitle && <p className="mt-1 text-sm leading-relaxed text-ink/60">{subtitle}</p>}
                    </div>
                </div>

                {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
            </div>
        </div>
    );
}