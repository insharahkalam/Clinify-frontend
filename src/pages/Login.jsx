import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, Check, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import AuthInput from "../components/AuthInput";
import AuthShowcase from "../components/AuthShowcase";
import "../index.css"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validate(form) {
    const errors = {};
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 6) errors.password = "At least 6 characters";
    return errors;
}
function getErrorMessage(err, fallback) {
    const e = err;
    if (e?.response)
        return e.response.data?.errors?.[0]?.msg || e.response.data?.message || fallback;
    return e?.message || fallback;
}
function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [capsOn, setCapsOn] = useState(false);
    const [shake, setShake] = useState(false);
    const errors = validate(form);
    const showError = (field) => (touched[field] ? errors[field] : void 0);
    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));
    const checkCaps = (e) => setCapsOn(e.getModifierState("CapsLock"));
    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };
    const onSubmit = async (e) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        if (Object.keys(errors).length) {
            triggerShake();
            return;
        }
        setLoading(true);
        try {
            const user = await login(form.email.trim(), form.password);
            setSuccess(true);
            toast.success(`Welcome back, ${user.name}`);
            setTimeout(() => navigate("/"), 900);
        } catch (err) {
            triggerShake();
            toast.error(getErrorMessage(err, "Sign in failed"));
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-page p-4 sm:p-6">
            <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-2">
                <AuthShowcase heading="Every part of your health, in one smart place." />

                <main className="flex items-center justify-center py-8">
                    <div className="w-full max-w-md animate-fade-up">
                        <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
                            <Logo className="mb-8" />
                            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                                Welcome back
                            </h1>
                            <p className="mt-2 text-sm text-ink-secondary">
                                Sign in to your account
                            </p>
                        </div>

                        <form
                            onSubmit={onSubmit}
                            noValidate
                            className={`rounded-2xl border border-line bg-card p-6 shadow-card transition-shadow duration-300 hover:shadow-hover sm:p-8 ${shake ? "animate-shake" : ""}`}
                        >
                            <AuthInput
                                label="Email"
                                type="email"
                                name="email"
                                icon={Mail}
                                placeholder="you@example.com"
                                autoComplete="email"
                                value={form.email}
                                onChange={onChange}
                                onBlur={onBlur}
                                error={showError("email")}
                                valid={!errors.email}
                            />

                            <AuthInput
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                icon={Lock}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                value={form.password}
                                onChange={onChange}
                                onBlur={onBlur}
                                onKeyUp={checkCaps}
                                onKeyDown={checkCaps}
                                error={showError("password")}
                                hint={
                                    capsOn ? (
                                        <span className="text-warning">Caps Lock is on</span>
                                    ) : (
                                        void 0
                                    )
                                }
                                rightSlot={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        aria-label={
                                            showPassword ? "Hide password" : "Show password"
                                        }
                                        className="mr-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-muted transition hover:bg-lavender-light hover:text-primary active:scale-90"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />

                            <button
                                type="submit"
                                disabled={loading || success}
                                className={`group mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-on-primary shadow-card transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-secondary active:scale-[0.98] disabled:cursor-not-allowed ${success ? "bg-success" : "bg-primary hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-hover active:bg-primary-active disabled:opacity-70"}`}
                            >
                                {success ? (
                                    <>
                                        <Check size={18} className="animate-pop" /> Signed in
                                    </>
                                ) : loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight
                                            size={16}
                                            className="transition-transform duration-200 group-hover:translate-x-1"
                                        />
                                    </>
                                )}
                            </button>

                            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-section px-4 py-3 text-xs text-ink-secondary">
                                <ShieldCheck size={16} className="text-primary" />
                                Your data is private and encrypted
                            </div>
                        </form>

                        <p className="mt-6 text-center text-sm text-ink-secondary">
                            New patient?{" "}
                            <Link
                                to="/register"
                                className="font-semibold text-primary underline-offset-4 transition hover:text-primary-hover hover:underline"
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
export { LoginPage as default };
