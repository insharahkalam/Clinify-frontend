import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
function AuthInput({
    label,
    icon: Icon,
    error,
    valid,
    hint,
    rightSlot,
    id,
    name,
    className = "",
    onFocus,
    onBlur,
    ...rest
}) {
    const [focused, setFocused] = useState(false);
    const inputId = id || `field-${name}`;
    const messageId = `${inputId}-message`;
    const frame = error
        ? "border-danger"
        : focused
          ? "border-primary ring-4 ring-secondary"
          : "border-line hover:border-secondary";
    const iconColor = error ? "text-danger" : focused ? "text-primary" : "text-ink-muted";
    return (
        <div className={className}>
            <label
                htmlFor={inputId}
                className={`mb-1.5 block text-sm font-medium transition-colors duration-200 ${focused ? "text-primary" : "text-ink"}`}
            >
                {label}
            </label>

            <div
                className={`flex items-center rounded-xl border-2 bg-card transition-all duration-200 ${frame}`}
            >
                {Icon && (
                    <Icon
                        size={18}
                        className={`ml-3.5 shrink-0 transition-all duration-200 ${iconColor} ${focused ? "scale-110" : ""}`}
                    />
                )}
                <input
                    id={inputId}
                    name={name}
                    aria-invalid={!!error}
                    aria-describedby={error || hint ? messageId : void 0}
                    className="h-12 w-full min-w-0 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-ink-muted"
                    onFocus={(e) => {
                        setFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    {...rest}
                />
                {error ? (
                    <AlertCircle size={18} className="mr-3 shrink-0 animate-pop text-danger" />
                ) : valid ? (
                    <CheckCircle2 size={18} className="mr-3 shrink-0 animate-pop text-success" />
                ) : null}
                {rightSlot}
            </div>

            <div id={messageId} className="min-h-7 pb-1 pt-1.5 text-xs">
                {error ? (
                    <p key={error} className="animate-fade-up text-danger">
                        {error}
                    </p>
                ) : hint ? (
                    <div className="animate-fade-up text-ink-muted">{hint}</div>
                ) : null}
            </div>
        </div>
    );
}
export { AuthInput as default };
