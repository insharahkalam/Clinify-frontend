export default function PageHeader({ title, subtitle, action }) {
    return (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}