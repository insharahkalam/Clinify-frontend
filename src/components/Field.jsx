/**
 * Reusable form field for MediSync AI.
 * Renders an <input> by default, or a <select> / <textarea> via the `as` prop.
 */
export default function Field({
    label,
    name,
    as = "input",
    hint,
    className = "",
    inputClassName = "",
    children,
    required,
    ...props
}) {
    const Tag = as;

    const control =
        "w-full rounded-xl border border-input-line bg-input px-4 py-3 text-sm text-ink " +
        "placeholder:text-placeholder outline-none transition " +
        "hover:border-secondary focus:border-focus focus:ring-4 focus:ring-lavender-light";

    return (
        <label htmlFor={name} className={`flex flex-col gap-1.5 ${className}`}>
            <span className="text-sm font-medium text-ink">
                {label}
                {required && <span className="ml-0.5 text-danger">*</span>}
            </span>

            {as === "select" ? (
                <div className="relative">
                    <select
                        id={name}
                        name={name}
                        required={required}
                        className={`${control} appearance-none pr-10 ${inputClassName}`}
                        {...props}
                    >
                        {children}
                    </select>
                    <svg
                        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            ) : (
                <Tag id={name} name={name} required={required} className={`${control} ${inputClassName}`} {...props}>
                    {children}
                </Tag>
            )}

            {hint && <span className="text-xs text-ink-muted">{hint}</span>}
        </label>
    );
}