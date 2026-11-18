function scorePassword(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    return Math.max(1, score);
}
const LEVELS = [
    { label: "Weak", bar: "bg-danger", text: "text-danger" },
    { label: "Fair", bar: "bg-warning", text: "text-warning" },
    { label: "Good", bar: "bg-info", text: "text-info" },
    { label: "Strong", bar: "bg-success", text: "text-success" },
];
function PasswordStrength({ password }) {
    const score = scorePassword(password);
    if (!score) return null;
    const level = LEVELS[score - 1] ?? LEVELS[0];
    return (
        <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1">
                {LEVELS.map((l, i) => (
                    <span
                        key={l.label}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < score ? level.bar : "bg-line-light"}`}
                    />
                ))}
            </div>
            <span className={`text-xs font-semibold ${level.text}`}>{level.label}</span>
        </div>
    );
}
export { PasswordStrength as default, scorePassword };
