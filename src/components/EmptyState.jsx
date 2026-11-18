export default function EmptyState({ icon: Icon, title, text }) {
    return (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
            {Icon && (
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-secondary/60 text-primary-dark">
                    <Icon size={22} />
                </div>
            )}
            <h3 className="font-semibold">{title}</h3>
            {text && <p className="mt-1 text-sm text-ink/60">{text}</p>}
        </div>
    );
}