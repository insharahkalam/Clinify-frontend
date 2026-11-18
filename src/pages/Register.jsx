import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ClipboardCheck,
    Droplet,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Mail,
    MapPin,
    Minus,
    Pencil,
    Phone,
    Plus,
    UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import AuthInput from "../components/AuthInput";
import AuthShowcase from "../components/AuthShowcase";
import "../index.css"
import PasswordStrength from "../components/PasswordStrength";
const initial = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    age: "",
    gender: "",
    bloodGroup: "",
    address: "",
};
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
];
const STEPS = [
    { title: "Personal", icon: UserRound },
    { title: "Medical", icon: Droplet },
    { title: "Review", icon: ClipboardCheck },
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateStep(step, form) {
    const errors = {};
    if (step === 0) {
        if (form.name.trim().length < 2) errors.name = "Enter your full name";
        if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email";
        if (form.phone && !/^[0-9+\s-]{10,15}$/.test(form.phone))
            errors.phone = "Enter a valid phone number";
        if (form.password.length < 6) errors.password = "At least 6 characters";
        if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password";
        else if (form.confirmPassword !== form.password)
            errors.confirmPassword = "Passwords don't match";
    }
    if (step === 1 && form.age !== "") {
        const age = Number(form.age);
        if (!Number.isInteger(age) || age < 0 || age > 120)
            errors.age = "Age must be between 0 and 120";
    }
    return errors;
}
function getErrorMessage(err, fallback) {
    const e = err;
    if (e?.response)
        return e.response.data?.errors?.[0]?.msg || e.response.data?.message || fallback;
    return e?.message || fallback;
}
function SectionTitle({ icon: Icon, title, subtitle }) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-lavender-light text-primary">
                <Icon size={18} />
            </div>
            <div>
                <h2 className="text-sm font-semibold text-ink">{title}</h2>
                <p className="text-xs text-ink-muted">{subtitle}</p>
            </div>
        </div>
    );
}
function Stepper({ step, onJump }) {
    return (
        <div className="mb-8">
            <div className="relative flex items-center justify-between">
                <div className="absolute left-5 right-5 top-5 h-1 rounded-full bg-line-light" />
                <div
                    className="absolute left-5 top-5 h-1 rounded-full bg-primary transition-all duration-500"
                    style={{ width: `calc((100% - 2.5rem) * ${step / (STEPS.length - 1)})` }}
                />
                {STEPS.map((s, i) => {
                    const done = i < step;
                    const current = i === step;
                    const Icon = s.icon;
                    return (
                        <button
                            key={s.title}
                            type="button"
                            disabled={!done}
                            onClick={() => onJump(i)}
                            className="relative z-10 flex flex-col items-center gap-2 disabled:cursor-default"
                        >
                            <span
                                className={`grid h-10 w-10 place-items-center rounded-full border-2 transition-all duration-300 ${done ? "border-primary bg-primary text-on-primary hover:scale-110" : current ? "scale-110 border-primary bg-card text-primary ring-4 ring-secondary" : "border-line bg-card text-ink-muted"}`}
                            >
                                {done ? (
                                    <Check size={18} className="animate-pop" />
                                ) : (
                                    <Icon size={18} />
                                )}
                            </span>
                            <span
                                className={`text-xs font-semibold ${current || done ? "text-ink" : "text-ink-muted"}`}
                            >
                                {s.title}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
function Chip({ selected, onClick, children }) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={`flex items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${selected ? "border-primary bg-primary text-on-primary shadow-hover" : "border-line bg-card text-ink-secondary hover:-translate-y-0.5 hover:border-primary hover:text-primary"}`}
        >
            {children}
        </button>
    );
}
function ReviewRow({ label, value }) {
    return (
        <div className="flex justify-between gap-4 py-2 text-sm">
            <span className="text-ink-muted">{label}</span>
            <span className="text-right font-medium text-ink">{value || "\u2014"}</span>
        </div>
    );
}
function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState(initial);
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState("forward");
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const errors = validateStep(step, form);
    const err = (field) => (touched[field] ? errors[field] : void 0);
    const ok = (field) => !!form[field] && !errors[field];
    const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
    const onChange = (e) => set(e.target.name, e.target.value);
    const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));
    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };
    const goTo = (target) => {
        setDirection(target > step ? "forward" : "back");
        setStep(target);
    };
    const next = () => {
        if (Object.keys(errors).length) {
            setTouched((t) => ({
                ...t,
                ...Object.fromEntries(Object.keys(errors).map((k) => [k, true])),
            }));
            triggerShake();
            return;
        }
        goTo(step + 1);
    };
    const changeAge = (delta) => {
        const current = form.age === "" ? 25 : Number(form.age) || 0;
        set("age", String(Math.min(120, Math.max(0, current + delta))));
    };
    const onSubmit = async (e) => {
        e.preventDefault();
        if (step < STEPS.length - 1) {
            next();
            return;
        }
        setLoading(true);
        try {
            const { confirmPassword: _confirm, ...payload } = form;
            await register({ ...payload, age: form.age ? Number(form.age) : void 0 });
            toast.success("Account created!");
            navigate("/");
        } catch (error) {
            triggerShake();
            toast.error(getErrorMessage(error, "Registration failed"));
        } finally {
            setLoading(false);
        }
    };
    const genderLabel = GENDERS.find((g) => g.value === form.gender)?.label || "";
    const animation = direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";
    return (
        <div className="min-h-screen bg-page p-4 sm:p-6">
            <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <AuthShowcase heading="3 quick steps to your complete health profile." />

                <main className="flex items-center justify-center py-8">
                    <div className="w-full max-w-xl animate-fade-up">
                        <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
                            <Logo className="mb-8" />
                            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                                Create patient account
                            </h1>
                            <p className="mt-2 text-sm text-ink-secondary">
                                Fill in a few details to get started
                            </p>
                        </div>

                        <form
                            onSubmit={onSubmit}
                            noValidate
                            className={`rounded-2xl border border-line bg-card p-6 shadow-card transition-shadow duration-300 hover:shadow-hover sm:p-8 ${shake ? "animate-shake" : ""}`}
                        >
                            <Stepper step={step} onJump={goTo} />

                            <div key={step} className={animation}>
                                {step === 0 && (
                                    <>
                                        <SectionTitle
                                            icon={UserRound}
                                            title="Personal details"
                                            subtitle="Used for sign-in and contact"
                                        />
                                        <div className="grid gap-x-5 sm:grid-cols-2">
                                            <AuthInput
                                                label="Full name"
                                                name="name"
                                                icon={UserRound}
                                                placeholder="Ahmed Khan"
                                                autoComplete="name"
                                                value={form.name}
                                                onChange={onChange}
                                                onBlur={onBlur}
                                                error={err("name")}
                                                valid={ok("name")}
                                            />
                                            <AuthInput
                                                label="Phone (optional)"
                                                name="phone"
                                                type="tel"
                                                icon={Phone}
                                                placeholder="03xx xxxxxxx"
                                                autoComplete="tel"
                                                value={form.phone}
                                                onChange={onChange}
                                                onBlur={onBlur}
                                                error={err("phone")}
                                                valid={ok("phone")}
                                            />
                                            <AuthInput
                                                label="Email"
                                                name="email"
                                                type="email"
                                                icon={Mail}
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                                value={form.email}
                                                onChange={onChange}
                                                onBlur={onBlur}
                                                error={err("email")}
                                                valid={ok("email")}
                                                className="sm:col-span-2"
                                            />
                                            <AuthInput
                                                label="Password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                icon={Lock}
                                                placeholder="Min 6 characters"
                                                autoComplete="new-password"
                                                value={form.password}
                                                onChange={onChange}
                                                onBlur={onBlur}
                                                error={err("password")}
                                                hint={
                                                    form.password ? (
                                                        <PasswordStrength
                                                            password={form.password}
                                                        />
                                                    ) : (
                                                        void 0
                                                    )
                                                }
                                                rightSlot={
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword((s) => !s)}
                                                        aria-label={
                                                            showPassword
                                                                ? "Hide password"
                                                                : "Show password"
                                                        }
                                                        className="mr-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-muted transition hover:bg-lavender-light hover:text-primary active:scale-90"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff size={18} />
                                                        ) : (
                                                            <Eye size={18} />
                                                        )}
                                                    </button>
                                                }
                                            />
                                            <AuthInput
                                                label="Confirm password"
                                                name="confirmPassword"
                                                type={showPassword ? "text" : "password"}
                                                icon={Lock}
                                                placeholder="Re-enter password"
                                                autoComplete="new-password"
                                                value={form.confirmPassword}
                                                onChange={onChange}
                                                onBlur={onBlur}
                                                error={err("confirmPassword")}
                                                valid={ok("confirmPassword")}
                                            />
                                        </div>
                                    </>
                                )}

                                {step === 1 && (
                                    <>
                                        <SectionTitle
                                            icon={Droplet}
                                            title="Medical details"
                                            subtitle="Helps your doctor care for you — all optional"
                                        />

                                        <div className="grid gap-x-5 sm:grid-cols-2">
                                            <div className="mb-5">
                                                <span className="mb-1.5 block text-sm font-medium text-ink">
                                                    Age
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        aria-label="Decrease age"
                                                        onClick={() => changeAge(-1)}
                                                        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-line text-ink-secondary transition hover:border-primary hover:text-primary active:scale-90"
                                                    >
                                                        <Minus size={18} />
                                                    </button>
                                                    <input
                                                        name="age"
                                                        type="number"
                                                        inputMode="numeric"
                                                        min={0}
                                                        max={120}
                                                        placeholder="28"
                                                        aria-label="Age"
                                                        value={form.age}
                                                        onChange={onChange}
                                                        onBlur={onBlur}
                                                        className={`h-12 w-full min-w-0 rounded-xl border-2 bg-card text-center text-lg font-semibold text-ink outline-none transition placeholder:text-ink-muted ${err("age") ? "border-danger" : "border-line focus:border-primary focus:ring-4 focus:ring-secondary"}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        aria-label="Increase age"
                                                        onClick={() => changeAge(1)}
                                                        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-line text-ink-secondary transition hover:border-primary hover:text-primary active:scale-90"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </div>
                                                {err("age") && (
                                                    <p className="animate-fade-up pt-1.5 text-xs text-danger">
                                                        {err("age")}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mb-5">
                                                <span className="mb-1.5 block text-sm font-medium text-ink">
                                                    Gender
                                                </span>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {GENDERS.map((g) => (
                                                        <Chip
                                                            key={g.value}
                                                            selected={form.gender === g.value}
                                                            onClick={() =>
                                                                set(
                                                                    "gender",
                                                                    form.gender === g.value
                                                                        ? ""
                                                                        : g.value,
                                                                )
                                                            }
                                                        >
                                                            {g.label}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-5">
                                            <span className="mb-1.5 block text-sm font-medium text-ink">
                                                Blood group
                                            </span>
                                            <div className="grid grid-cols-4 gap-2">
                                                {BLOOD_GROUPS.map((b) => (
                                                    <Chip
                                                        key={b}
                                                        selected={form.bloodGroup === b}
                                                        onClick={() =>
                                                            set(
                                                                "bloodGroup",
                                                                form.bloodGroup === b ? "" : b,
                                                            )
                                                        }
                                                    >
                                                        <Droplet size={14} /> {b}
                                                    </Chip>
                                                ))}
                                            </div>
                                        </div>

                                        <AuthInput
                                            label="Address"
                                            name="address"
                                            icon={MapPin}
                                            placeholder="City, area"
                                            autoComplete="street-address"
                                            value={form.address}
                                            onChange={onChange}
                                            onBlur={onBlur}
                                            valid={ok("address")}
                                        />
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <SectionTitle
                                            icon={ClipboardCheck}
                                            title="Review your details"
                                            subtitle="All good? Create your account"
                                        />
                                        <div className="space-y-4">
                                            {[
                                                {
                                                    title: "Personal",
                                                    target: 0,
                                                    rows: [
                                                        ["Name", form.name],
                                                        ["Email", form.email],
                                                        ["Phone", form.phone],
                                                        [
                                                            "Password",
                                                            "\u2022".repeat(form.password.length),
                                                        ],
                                                    ],
                                                },
                                                {
                                                    title: "Medical",
                                                    target: 1,
                                                    rows: [
                                                        ["Age", form.age],
                                                        ["Gender", genderLabel],
                                                        ["Blood group", form.bloodGroup],
                                                        ["Address", form.address],
                                                    ],
                                                },
                                            ].map((section) => (
                                                <div
                                                    key={section.title}
                                                    className="rounded-xl border border-line bg-section p-4"
                                                >
                                                    <div className="mb-1 flex items-center justify-between">
                                                        <h3 className="text-sm font-semibold text-ink">
                                                            {section.title}
                                                        </h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => goTo(section.target)}
                                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition hover:bg-lavender-light"
                                                        >
                                                            <Pencil size={12} /> Edit
                                                        </button>
                                                    </div>
                                                    <div className="divide-y divide-line">
                                                        {section.rows.map(([label, value]) => (
                                                            <ReviewRow
                                                                key={label}
                                                                label={label ?? ""}
                                                                value={value ?? ""}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-6 flex gap-3">
                                {step > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => goTo(step - 1)}
                                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-line px-5 py-3 text-sm font-semibold text-ink-secondary transition hover:border-primary hover:text-primary active:scale-95"
                                    >
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-on-primary shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-hover focus:outline-none focus:ring-4 focus:ring-secondary active:scale-[0.98] active:bg-primary-active disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Creating
                                            account...
                                        </>
                                    ) : step < STEPS.length - 1 ? (
                                        <>
                                            Continue
                                            <ArrowRight
                                                size={16}
                                                className="transition-transform duration-200 group-hover:translate-x-1"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} /> Create account
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <p className="mt-6 text-center text-sm text-ink-secondary">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="font-semibold text-primary underline-offset-4 transition hover:text-primary-hover hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
export { RegisterPage as default };
