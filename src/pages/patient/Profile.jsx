import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Calendar, Check, CircleAlert, Droplet, HeartPulse, Keyboard, Loader2, Lock, Mail, MapPin, Minus, Phone, Plus, RotateCcw, ShieldCheck, User, UserRound, } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg } from "../../utils/format";

/* ------------------------------------------------------------------
   Config
------------------------------------------------------------------- */
const FIELDS = ["name", "phone", "age", "gender", "bloodGroup", "address"];

const FIELD_META = {
    name: { label: "Full name", target: "pf-name" },
    phone: { label: "Phone number", target: "pf-phone" },
    age: { label: "Age", target: "pf-age" },
    gender: { label: "Gender", target: "pf-gender" },
    bloodGroup: { label: "Blood group", target: "pf-blood" },
    address: { label: "Address", target: "pf-address" },
};

const GENDERS = [
    ["male", "Male"],
    ["female", "Female"],
    ["other", "Other"],
];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EMPTY = { name: "", phone: "", age: "", gender: "", bloodGroup: "", address: "" };

// 03xx xxxxxxx  ya  +923xx xxxxxxx
const isValidPhone = (v) => !v || /^(\+92|0)3\d{9}$/.test(String(v).replace(/[\s-]/g, ""));

const inputCls =
    "w-full rounded-xl border border-input-line bg-card py-2.5 pl-10 pr-10 text-sm text-ink outline-none transition placeholder:text-placeholder hover:border-lavender-medium focus:border-focus focus:ring-4 focus:ring-secondary/60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger-bg";

const chipCls = (active) =>
    `rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60 ${active
        ? "border-primary bg-primary text-on-primary shadow-md shadow-primary/30"
        : "border-line bg-card text-ink-secondary hover:-translate-y-0.5 hover:border-lavender-medium hover:bg-lavender-light hover:text-primary"
    }`;

const isFilled = (v) => String(v ?? "").trim() !== "";

/* ------------------------------------------------------------------
   Small pieces
------------------------------------------------------------------- */
function FieldLabel({ children, required, changed, htmlFor }) {
    return (
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
            {htmlFor ? <label htmlFor={htmlFor}>{children}</label> : children}
            {required && <span className="text-primary">*</span>}
            {changed && (
                <span className="animate-fade-up rounded-full bg-warning-bg px-1.5 py-px text-[10px] font-semibold text-warning">
                    edited
                </span>
            )}
        </span>
    );
}

function InputField({ id, label, icon: Icon, required, changed, error, hint, suffix, ...props }) {
    const filled = isFilled(props.value);
    return (
        <div className="group">
            <FieldLabel htmlFor={id} required={required} changed={changed}>
                {label}
            </FieldLabel>
            <div className="relative">
                <Icon
                    size={16}
                    className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${error ? "text-danger" : "text-placeholder group-focus-within:text-primary"
                        }`}
                />
                <input
                    id={id}
                    {...props}
                    required={required}
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={error || hint ? `${id}-note` : undefined}
                    className={inputCls}
                />
                <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {suffix}
                    {!suffix && filled && !error && (
                        <span className="grid h-5 w-5 animate-fade-up place-items-center rounded-full bg-success-bg text-success">
                            <Check size={12} strokeWidth={3} />
                        </span>
                    )}
                    {!suffix && error && <CircleAlert size={16} className="text-danger" />}
                </span>
            </div>
            {(error || hint) && (
                <p id={`${id}-note`} className={`mt-1.5 text-xs ${error ? "text-danger" : "text-ink-muted"}`}>
                    {error || hint}
                </p>
            )}
        </div>
    );
}

function ProgressRing({ value }) {
    const r = 34;
    const c = 2 * Math.PI * r;
    return (
        <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-lavender-light" />
                <circle
                    cx="40"
                    cy="40"
                    r={r}
                    fill="none"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c - (value / 100) * c}
                    className={`transition-all duration-700 ease-out ${value === 100 ? "stroke-success" : "stroke-primary"}`}
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center leading-none">
                <div>
                    <p className="text-xl font-bold tabular-nums text-ink">{value}%</p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ink-muted">done</p>
                </div>
            </div>
        </div>
    );
}

function HealthTile({ icon: Icon, label, value, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex flex-col items-center rounded-2xl border border-line-light bg-section px-2 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-secondary hover:bg-lavender-light hover:shadow-card active:scale-95"
        >
            <Icon size={16} className="text-primary transition-transform group-hover:scale-110" />
            <p className={`mt-1.5 text-base font-bold ${value ? "text-ink" : "text-placeholder"}`}>{value || "—"}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        </button>
    );
}

function InfoRow({ icon: Icon, value, empty, onClick }) {
    const Tag = onClick ? "button" : "div";
    return (
        <Tag
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-section"
        >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-lavender-light text-primary">
                <Icon size={14} />
            </span>
            <span className={`min-w-0 truncate ${value ? "text-ink-secondary" : "italic text-placeholder"}`}>
                {value || empty}
            </span>
        </Tag>
    );
}

function Skeleton() {
    return (
        <div className="mx-auto max-w-6xl animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-lavender-light" />
            <div className="mt-2 h-4 w-72 rounded bg-section" />
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="h-[30rem] rounded-3xl bg-card shadow-card" />
                <div className="h-[30rem] rounded-3xl bg-card shadow-card lg:col-span-2" />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------
   Form view (sirf UI + form state)
------------------------------------------------------------------- */
function ProfileView({ initialValues, email = "", onSave }) {
    const [form, setForm] = useState(initialValues || EMPTY);
    const [initial, setInitial] = useState(initialValues || EMPTY);
    const [saving, setSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [highlight, setHighlight] = useState(null);
    const formRef = useRef(null);

    // FIX: sirf tab sync karo jab data ka *content* badle, object ki identity nahi.
    // Warna parent ke har re-render par user ki edits reset ho jati thin.
    const initialKey = JSON.stringify(initialValues ?? null);
    useEffect(() => {
        if (!initialValues) return;
        setForm(initialValues);
        setInitial(initialValues);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialKey]);

    useEffect(() => {
        if (!justSaved) return;
        const t = setTimeout(() => setJustSaved(false), 2200);
        return () => clearTimeout(t);
    }, [justSaved]);

    useEffect(() => {
        if (!highlight) return;
        const t = setTimeout(() => setHighlight(null), 1400);
        return () => clearTimeout(t);
    }, [highlight]);

    const changedKeys = FIELDS.filter((k) => String(form[k] ?? "") !== String(initial[k] ?? ""));
    const dirty = changedKeys.length > 0;
    const phoneError = isValidPhone(form.phone) ? "" : "Sahi number likhein, masalan 0301 2345678";
    const missing = FIELDS.filter((k) => !isFilled(form[k]));
    const completeness = Math.round(((FIELDS.length - missing.length) / FIELDS.length) * 100);

    // Ctrl/Cmd + S se save
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                if (dirty && !saving) formRef.current?.requestSubmit();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [dirty, saving]);

    // Unsaved changes ke saath page band karne pe warning
    useEffect(() => {
        if (!dirty) return;
        const onLeave = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", onLeave);
        return () => window.removeEventListener("beforeunload", onLeave);
    }, [dirty]);

    const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
    const onChange = (e) => set(e.target.name, e.target.value);
    // Selected option pe dobara click karein to clear ho jaye
    const toggle = (name, value) => setForm((f) => ({ ...f, [name]: f[name] === value ? "" : value }));

    const stepAge = (delta) => {
        const current = form.age === "" ? 0 : Number(form.age);
        set("age", String(Math.min(120, Math.max(0, current + delta))));
    };

    // Missing field pe click -> wahan scroll + focus
    const goTo = (key) => {
        const el = document.getElementById(FIELD_META[key].target);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const focusable = el.matches("input, button") ? el : el.querySelector("button");
        focusable?.focus({ preventScroll: true });
        setHighlight(key);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (phoneError) {
            goTo("phone");
            return;
        }
        setSaving(true);
        try {
            await onSave?.(form);
            setInitial(form);
            setJustSaved(true);
        } catch {
            // error ka toast parent (Profile) dikhata hai
        } finally {
            setSaving(false);
        }
    };

    const ring = (key) => (highlight === key ? "rounded-2xl ring-4 ring-secondary/70 ring-offset-4 ring-offset-card" : "");
    const genderLabel = GENDERS.find(([v]) => v === form.gender)?.[1];

    return (
        <div className="mx-auto max-w-6xl">
            {/* Page header */}
            <div className="mb-6 flex animate-fade-up flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">My Profile</h1>
                    <p className="mt-1 text-sm text-ink-secondary">Apni personal aur medical details manage karein</p>
                </div>
                <span
                    className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:self-auto ${dirty ? "bg-warning-bg text-warning" : justSaved ? "bg-success-bg text-success" : "bg-lavender-light text-primary"
                        }`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${dirty ? "animate-pulse bg-warning" : justSaved ? "bg-success" : "bg-primary"}`} />
                    {dirty
                        ? `${changedKeys.length} unsaved ${changedKeys.length === 1 ? "change" : "changes"}`
                        : justSaved
                            ? "All changes saved"
                            : "Up to date"}
                </span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* ---------------- Summary card ---------------- */}
                <aside className="h-fit animate-fade-up space-y-6 lg:sticky lg:top-6">
                    <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-card transition-shadow duration-300 hover:shadow-hover">
                        <div className="relative h-24 overflow-hidden bg-ai-gradient">
                            <div className="absolute -right-6 -top-10 h-32 w-32 animate-blob rounded-full bg-card opacity-20 blur-2xl" />
                            <div
                                className="absolute -left-8 top-6 h-24 w-24 animate-blob rounded-full bg-card opacity-20 blur-2xl"
                                style={{ animationDelay: "-3s" }}
                            />
                        </div>
                        <div className="-mt-12 px-6 pb-6">
                            <div className="group relative mx-auto w-fit rounded-full bg-card p-1 shadow-card">
                                <div className="grid h-24 w-24 place-items-center rounded-full bg-secondary text-4xl font-semibold text-primary-hover transition-transform duration-300 group-hover:scale-105">
                                    {form.name?.trim()?.[0]?.toUpperCase() || <User size={34} />}
                                </div>
                                <span
                                    className={`absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full border-2 border-card ${completeness === 100 ? "bg-success" : "bg-primary"
                                        } text-on-primary`}
                                >
                                    {completeness === 100 ? <ShieldCheck size={12} /> : <UserRound size={12} />}
                                </span>
                            </div>
                            <div className="mt-3 text-center">
                                <h2 className="truncate text-lg font-semibold text-ink">{form.name || "Aapka naam"}</h2>
                                <p className="truncate text-xs text-ink-muted">{email}</p>
                                <span className="mt-2 inline-block rounded-full bg-lavender-light px-3 py-0.5 text-xs font-medium text-primary">
                                    Patient
                                </span>
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-2">
                                <HealthTile icon={Droplet} label="Blood" value={form.bloodGroup} onClick={() => goTo("bloodGroup")} />
                                <HealthTile icon={Calendar} label="Age" value={form.age} onClick={() => goTo("age")} />
                                <HealthTile icon={User} label="Gender" value={genderLabel} onClick={() => goTo("gender")} />
                            </div>

                            <div className="mt-5 space-y-1 border-t border-line-light pt-4 text-sm">
                                <InfoRow icon={Mail} value={email} />
                                <InfoRow icon={Phone} value={form.phone} empty="Phone add karein" onClick={() => goTo("phone")} />
                                <InfoRow icon={MapPin} value={form.address} empty="Address add karein" onClick={() => goTo("address")} />
                            </div>
                        </div>
                    </div>

                    {/* Completeness card */}
                    <div className="rounded-3xl border border-line bg-card p-5 shadow-card" style={{ animationDelay: "60ms" }}>
                        <div className="flex items-center gap-4">
                            <ProgressRing value={completeness} />
                            <div className="min-w-0">
                                <p className="font-semibold text-ink">
                                    {completeness === 100 ? "Profile complete!" : "Profile complete karein"}
                                </p>
                                <p className="mt-0.5 text-xs text-ink-muted">
                                    {completeness === 100
                                        ? "Doctors ke paas aapki poori details hain."
                                        : `${missing.length} ${missing.length === 1 ? "cheez" : "cheezein"} baqi — doctor ko behtar madad milegi.`}
                                </p>
                            </div>
                        </div>
                        {missing.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {missing.map((k) => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => goTo(k)}
                                        className="inline-flex animate-fade-up items-center gap-1 rounded-full border border-dashed border-lavender-medium bg-lavender-soft px-3 py-1 text-xs font-medium text-primary transition hover:border-primary hover:bg-lavender-light active:scale-95"
                                    >
                                        <Plus size={12} />
                                        {FIELD_META[k].label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* ---------------- Edit form ---------------- */}
                <form ref={formRef} onSubmit={onSubmit} className="space-y-6 lg:col-span-2">
                    <section
                        className="animate-fade-up rounded-3xl border border-line bg-card p-6 shadow-card sm:p-7"
                        style={{ animationDelay: "80ms" }}
                    >
                        <div className="mb-6 flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-lavender-light text-primary">
                                <User size={18} />
                            </span>
                            <div>
                                <h3 className="font-semibold text-ink">Personal details</h3>
                                <p className="text-xs text-ink-muted">Naam, rabta aur pata</p>
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className={`transition-all duration-300 ${ring("name")}`}>
                                <InputField
                                    id="pf-name"
                                    label="Full name"
                                    icon={User}
                                    name="name"
                                    value={form.name}
                                    onChange={onChange}
                                    placeholder="Masalan: Ali Khan"
                                    autoComplete="name"
                                    changed={changedKeys.includes("name")}
                                    required
                                />
                            </div>

                            <div>
                                <FieldLabel htmlFor="pf-email">Email</FieldLabel>
                                <div className="relative">
                                    <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-placeholder" />
                                    <input
                                        id="pf-email"
                                        value={email}
                                        readOnly
                                        className={`${inputCls} cursor-not-allowed bg-section text-ink-muted hover:border-input-line`}
                                    />
                                    <Lock size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-placeholder" />
                                </div>
                                <p className="mt-1.5 text-xs text-ink-muted">Email change nahi ho sakti</p>
                            </div>

                            <div className={`transition-all duration-300 ${ring("phone")}`}>
                                <InputField
                                    id="pf-phone"
                                    label="Phone"
                                    icon={Phone}
                                    type="tel"
                                    name="phone"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    value={form.phone}
                                    onChange={onChange}
                                    placeholder="03xx xxxxxxx"
                                    changed={changedKeys.includes("phone")}
                                    error={phoneError}
                                />
                            </div>

                            <div className={`transition-all duration-300 ${ring("age")}`}>
                                <InputField
                                    id="pf-age"
                                    label="Age"
                                    icon={Calendar}
                                    type="number"
                                    name="age"
                                    min="0"
                                    max="120"
                                    value={form.age}
                                    onChange={onChange}
                                    placeholder="Saal"
                                    changed={changedKeys.includes("age")}
                                    suffix={
                                        <span className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                aria-label="Age kam karein"
                                                onClick={() => stepAge(-1)}
                                                className="grid h-6 w-6 place-items-center rounded-lg bg-lavender-light text-primary transition hover:bg-primary hover:text-on-primary active:scale-90"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Age barhayein"
                                                onClick={() => stepAge(1)}
                                                className="grid h-6 w-6 place-items-center rounded-lg bg-lavender-light text-primary transition hover:bg-primary hover:text-on-primary active:scale-90"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </span>
                                    }
                                />
                            </div>

                            <div className={`transition-all duration-300 sm:col-span-2 ${ring("address")}`}>
                                <InputField
                                    id="pf-address"
                                    label="Address"
                                    icon={MapPin}
                                    name="address"
                                    autoComplete="street-address"
                                    value={form.address}
                                    onChange={onChange}
                                    placeholder="Ghar ka pata"
                                    changed={changedKeys.includes("address")}
                                />
                            </div>

                            <div id="pf-gender" className={`transition-all duration-300 sm:col-span-2 ${ring("gender")}`}>
                                <FieldLabel changed={changedKeys.includes("gender")}>Gender</FieldLabel>
                                <div role="group" aria-label="Gender" className="grid grid-cols-3 gap-2 sm:max-w-sm">
                                    {GENDERS.map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            aria-pressed={form.gender === value}
                                            onClick={() => toggle("gender", value)}
                                            className={chipCls(form.gender === value)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        className="animate-fade-up rounded-3xl border border-line bg-card p-6 shadow-card sm:p-7"
                        style={{ animationDelay: "160ms" }}
                    >
                        <div className="mb-6 flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-danger-bg text-danger">
                                <HeartPulse size={18} />
                            </span>
                            <div>
                                <h3 className="font-semibold text-ink">Medical details</h3>
                                <p className="text-xs text-ink-muted">Emergency mein doctor ke liye zaroori</p>
                            </div>
                        </div>

                        <div id="pf-blood" className={`transition-all duration-300 ${ring("bloodGroup")}`}>
                            <FieldLabel changed={changedKeys.includes("bloodGroup")}>Blood group</FieldLabel>
                            <div role="group" aria-label="Blood group" className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                                {BLOOD_GROUPS.map((b) => (
                                    <button
                                        key={b}
                                        type="button"
                                        aria-pressed={form.bloodGroup === b}
                                        onClick={() => toggle("bloodGroup", b)}
                                        className={`${chipCls(form.bloodGroup === b)} flex items-center justify-center gap-1`}
                                    >
                                        <Droplet size={12} className={form.bloodGroup === b ? "fill-current" : ""} />
                                        {b}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-ink-muted">Dobara click karein to selection hat jayegi.</p>
                        </div>
                    </section>

                    {/* Sticky save bar */}
                    <div className="sticky bottom-4 z-10">
                        <div
                            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 pl-5 shadow-hover backdrop-blur-md transition-all duration-300 ${dirty ? "border-secondary bg-card/95" : "border-line bg-card/80"
                                }`}
                        >
                            <p className="flex items-center gap-2 text-sm text-ink-secondary">
                                {dirty ? (
                                    <>
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-warning" />
                                        Aapne {changedKeys.length} {changedKeys.length === 1 ? "cheez" : "cheezein"} badli hain
                                    </>
                                ) : (
                                    <>
                                        <Keyboard size={15} className="text-ink-muted" />
                                        <span className="hidden sm:inline">
                                            Tip: <kbd className="rounded-md border border-line bg-section px-1.5 py-0.5 text-[11px] font-semibold">Ctrl</kbd>{" "}
                                            + <kbd className="rounded-md border border-line bg-section px-1.5 py-0.5 text-[11px] font-semibold">S</kbd> se save
                                        </span>
                                        <span className="sm:hidden">Koi change nahi</span>
                                    </>
                                )}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={!dirty || saving}
                                    onClick={() => setForm(initial)}
                                    className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:border-lavender-medium hover:bg-section hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <RotateCcw size={15} /> Reset
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !dirty}
                                    className={`group relative flex items-center gap-2 overflow-hidden rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary shadow-md shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-hover active:translate-y-0 active:bg-primary-active disabled:pointer-events-none disabled:opacity-60 ${justSaved ? "disabled:bg-success disabled:opacity-100 disabled:shadow-success/30" : ""
                                        }`}
                                >
                                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-card/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : justSaved ? <Check size={16} /> : null}
                                    {saving ? "Saving..." : justSaved ? "Saved!" : "Save changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------
   Page: API se purana data laata hai, form mein bharta hai, save par PUT karta hai
------------------------------------------------------------------- */
export default function Profile() {
    const [values, setValues] = useState(null);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    const load = () => {
        setLoading(true);
        setFailed(false);
        api
            .get(ENDPOINTS.patient.profile)
            .then(({ data }) => {
                const { user, patient } = data;
                setEmail(user.email || "");
                setValues({
                    name: user.name || "",
                    phone: user.phone || "",
                    age: patient?.age != null ? String(patient.age) : "",
                    gender: patient?.gender || "",
                    bloodGroup: patient?.bloodGroup || "",
                    address: patient?.address || "",
                });
            })
            .catch((e) => {
                setFailed(true);
                toast.error(errMsg(e));
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleSave = async (form) => {
        try {
            await api.put(ENDPOINTS.patient.profile, {
                ...form,
                age: form.age === "" ? undefined : Number(form.age),
            });
            toast.success("Profile update ho gayi");
        } catch (err) {
            toast.error(errMsg(err));
            throw err; // taake ProfileView "Saved!" na dikhaye
        }
    };

    if (loading) return <Skeleton />;

    // Data load nahi hua to khali form mat dikhao, warna save par purana data mit sakta hai
    if (failed || !values) {
        return (
            <div className="mx-auto max-w-md rounded-3xl border border-line bg-card p-8 text-center shadow-card">
                <p className="font-semibold text-ink">Profile load nahi ho saki</p>
                <p className="mt-1 text-sm text-ink-muted">Dobara koshish karein.</p>
                <button
                    type="button"
                    onClick={load}
                    className="mt-5 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover active:scale-95"
                >
                    Retry
                </button>
            </div>
        );
    }

    return <ProfileView initialValues={values} email={email} onSave={handleSave} />;
}