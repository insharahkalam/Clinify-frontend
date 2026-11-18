const STYLES = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-secondary/70 text-primary-dark",
    completed: "bg-page text-ink/70 ring-1 ring-line",
    cancelled: "bg-red-50 text-red-500",
};

export default function StatusBadge({ status }) {
    return (
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STYLES[status] || STYLES.pending}`}>
            {status}
        </span>
    );
}