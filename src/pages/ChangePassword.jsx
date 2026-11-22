import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Lock,
    ShieldCheck,
    Sparkles,
    X,
} from "lucide-react";
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { errMsg } from "../utils/format";
import PageHeader from "../components/PageHeader";

const initial = { currentPassword: "", newPassword: "", confirm: "" };

const RULES = [
    { id: "len", label: "At least 8 characters", test: (v) => v.length >= 8 },
    { id: "case", label: "Upper and lowercase letters", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
    { id: "num", label: "At least one number", test: (v) => /\d/.test(v) },
    { id: "sym", label: "At least one symbol (!@#$)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

// index = number of rules passed (0..4)
const STRENGTH = [
    { label: "Very weak", bar: "bg-red-400", text: "text-red-500" },
    { label: "Weak", bar: "bg-orange-400", text: "text-orange-500" },
    { label: "Fair", bar: "bg-yellow-400", text: "text-yellow-600" },
    { label: "Strong", bar: "bg-emerald-400", text: "text-emerald-600" },
    { label: "Very strong", bar: "bg-emerald-500", text: "text-emerald-600" },
];

const TIPS = [
    "Use a different password for every account",
    "Avoid your name or date of birth",
    "Never share your password with anyone",
    "Long passphrases are often easier to remember",
];

function PasswordInput({ label, name, value, onChange, placeholder, autoComplete, status, hint }) {
    const [visible, setVisible] = useState(false);
    const [caps, setCaps] = useState(false);

    const ring =
        status === "error"
            ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
            : status === "ok"
                ? "border-emerald-300 focus-within:border-emerald-400 focus-within:ring-emerald-100"
                : "border-line hover:border-primary/40 focus-within:border-primary focus-within:ring-primary/15";

    return (
        <div>
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink/80">
                {label}
            </label>

            <div className={`flex items-center gap-2.5 rounded-xl border bg-white px-3.5 transition focus-within:ring-4 ${ring}`}>
                <Lock size={16} className="shrink-0 text-ink/35" />
                <input
                    id={name}
                    name={name}
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") ?? false)}
                    onBlur={() => setCaps(false)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required
                    className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-ink/35"
                />
                {status === "ok" && <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />}
                {status === "error" && <AlertCircle size={16} className="shrink-0 text-red-400" />}
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="shrink-0 rounded-md p-1.5 text-ink/45 transition hover:bg-black/5 hover:text-ink/80"
                >
                    {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>

            {(caps || hint) && (
                <p
                    className={`mt-1.5 text-xs ${caps ? "font-medium text-orange-500" : status === "error" ? "text-red-500" : "text-emerald-600"
                        }`}
                >
                    {caps ? "Caps Lock is on" : hint}
                </p>
            )}
        </div>
    );
}

function StrengthMeter({ password, checks, score }) {
    const strength = STRENGTH[score];
    const active = password ? Math.max(score, 1) : 0;

    return (
        <div
            className={`grid transition-all duration-300 ease-out ${password ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
        >
            <div className="overflow-hidden">
                <div className="rounded-xl bg-slate-50/80 p-3.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-ink/60">Password strength</span>
                        <span className={`text-xs font-semibold ${strength.text}`}>{strength.label}</span>
                    </div>

                    <div className="mt-2 flex gap-1.5">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= active ? strength.bar : "bg-line"
                                    }`}
                            />
                        ))}
                    </div>

                    <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                        {checks.map((c) => (
                            <li
                                key={c.id}
                                className={`flex items-center gap-2 text-xs transition-colors ${c.ok ? "text-emerald-600" : "text-ink/50"
                                    }`}
                            >
                                <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${c.ok ? "bg-emerald-100" : "bg-black/5"
                                        }`}
                                >
                                    {c.ok ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                                </span>
                                {c.label}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function ChangePassword() {
    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const checks = useMemo(
        () => RULES.map((r) => ({ ...r, ok: r.test(form.newPassword) })),
        [form.newPassword]
    );
    const score = checks.filter((c) => c.ok).length;

    const lengthOk = form.newPassword.length >= 8;
    const hasConfirm = form.confirm.length > 0;
    const matches = hasConfirm && form.newPassword === form.confirm;
    const sameAsOld = form.newPassword.length > 0 && form.newPassword === form.currentPassword;
    const canSubmit = Boolean(form.currentPassword) && lengthOk && matches && !sameAsOld && !saving;

    // simple progress for the footer hint
    const steps = [Boolean(form.currentPassword), lengthOk && !sameAsOld, matches];
    const done = steps.filter(Boolean).length;

    const submit = async (e) => {
        e.preventDefault();
        if (!lengthOk) return toast.error("New password must be at least 8 characters");
        if (!matches) return toast.error("The new passwords do not match");
        if (sameAsOld) return toast.error("New password must be different from the current one");

        setSaving(true);
        try {
            await api.put(ENDPOINTS.account.password, {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            toast.success("Password changed successfully");
            setForm(initial);
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader title="Change password" subtitle="Keep your account safe with a strong password" />

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Form */}
                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)] sm:p-8 lg:col-span-3"
                >
                    <section className="space-y-4">
                        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink/45">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
                                1
                            </span>
                            Verify your identity
                        </h2>
                        <PasswordInput
                            label="Current password"
                            name="currentPassword"
                            autoComplete="current-password"
                            value={form.currentPassword}
                            onChange={onChange}
                        />
                    </section>

                    <div className="h-px bg-line" />

                    <section className="space-y-4">
                        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink/45">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
                                2
                            </span>
                            New password
                        </h2>

                        <PasswordInput
                            label="New password"
                            name="newPassword"
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            value={form.newPassword}
                            onChange={onChange}
                            status={sameAsOld ? "error" : undefined}
                            hint={sameAsOld ? "New password cannot be the same as the current one" : null}
                        />

                        <StrengthMeter password={form.newPassword} checks={checks} score={score} />

                        <PasswordInput
                            label="Confirm new password"
                            name="confirm"
                            autoComplete="new-password"
                            placeholder="Re-enter your new password"
                            value={form.confirm}
                            onChange={onChange}
                            status={hasConfirm ? (matches ? "ok" : "error") : undefined}
                            hint={hasConfirm ? (matches ? "Passwords match" : "Passwords do not match") : null}
                        />
                    </section>

                    <div className="space-y-3 pt-1">
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                            {saving ? "Saving..." : "Change password"}
                        </button>

                        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
                            {steps.map((ok, i) => (
                                <span
                                    key={i}
                                    className={`h-1 w-8 rounded-full transition-colors duration-300 ${ok ? "bg-primary" : "bg-line"
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-center text-xs text-ink/45">
                            {done === 3 ? "All set, you're good to go" : `${done}/3 steps completed`}
                        </p>
                    </div>
                </form>

                {/* Side panel */}
                <aside className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-white to-white p-6">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/30">
                            <KeyRound size={20} />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-ink">Keep your account secure</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink/60">
                            After changing your password, you will need to use the new one the next time you log in.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-line bg-white p-6">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <Sparkles size={15} className="text-primary" />
                            Tips
                        </h4>
                        <ul className="mt-3 space-y-2.5">
                            {TIPS.map((t) => (
                                <li key={t} className="flex items-start gap-2.5 text-sm text-ink/65">
                                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary/70" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
}