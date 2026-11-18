/**
 * MediSync AI logo — medical cross with a heartbeat line and an AI sparkle.
 * Colors come from the theme tokens in index.css (fill-primary, fill-secondary, ...).
 *
 * <Logo />                 → mark + "MediSync AI" text
 * <Logo showText={false} /> → mark only
 */
export function LogoMark({ size = 48, className = "" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            className={className}
            role="img"
            aria-label="MediSync AI"
        >
            <rect width="48" height="48" rx="14" className="fill-primary" />
            {/* medical cross */}
            <rect x="18" y="9" width="12" height="30" rx="4" className="fill-on-primary" />
            <rect x="9" y="18" width="30" height="12" rx="4" className="fill-on-primary" />
            {/* heartbeat line */}
            <polyline
                points="11,24 18,24 21,19.5 25,29 28,21.5 30.5,24 37,24"
                fill="none"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-primary"
            />
            {/* AI sparkle */}
            <path
                d="M40 4.5 L41.3 7.7 L44.5 9 L41.3 10.3 L40 13.5 L38.7 10.3 L35.5 9 L38.7 7.7 Z"
                className="fill-secondary"
            />
        </svg>
    );
}

export default function Logo({ size = 44, showText = true, className = "" }) {
    return (
        <div className={`inline-flex items-center gap-3 ${className}`}>
            <LogoMark size={size} className="shadow-hover rounded-[14px]" />
            {showText && (
                <span className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-ink">
                    MediSync
                    <span className="rounded-md bg-lavender-light px-1.5 py-0.5 text-xs font-semibold text-primary-hover">
                        AI
                    </span>
                </span>
            )}
        </div>
    );
}