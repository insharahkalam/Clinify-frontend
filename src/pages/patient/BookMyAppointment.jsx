import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock,
    FileText,
    Loader2,
    Search,
    Sparkles,
    Stethoscope,
} from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatTime, todayStr } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import SlotPicker from "../../components/SlotPicker";

const QUICK_REASONS = ["Bukhar", "Khansi", "Sar dard", "Pet dard", "Routine checkup", "Follow-up"];
const MAX_REASON = 300;

const pad = (n) => String(n).padStart(2, "0");
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nextDays = (count) =>
    Array.from({ length: count }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });
const prettyDate = (ymd) =>
    ymd
        ? new Date(`${ymd}T00:00:00`).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : "—";
const initials = (name = "") =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

/* ---------- Reusable section card ---------- */
function Section({ step, icon: Icon, title, hint, done, delay = 0, children }) {
    return (
        <section
            style={{ animationDelay: `${delay}ms` }}
            className="animate-fade-up rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover focus-within:border-focus focus-within:shadow-hover"
        >
            <div className="mb-5 flex items-center gap-3">
                <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-all duration-300 ${done ? "scale-105 bg-success text-on-primary" : "bg-lavender-light text-primary"
                        }`}
                >
                    {done ? <CheckCircle2 size={18} /> : step}
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="flex items-center gap-2 font-semibold text-ink">
                        <Icon size={17} className="text-primary" />
                        {title}
                    </h2>
                    {hint && <p className="text-xs text-ink-muted">{hint}</p>}
                </div>
            </div>
            {children}
        </section>
    );
}

/* ---------- Summary row ---------- */
function SummaryRow({ icon: Icon, label, value, filled }) {
    return (
        <div className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-section">
            <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${filled ? "bg-lavender-light text-primary" : "bg-section text-placeholder"
                    }`}
            >
                <Icon size={16} />
            </span>
            <div className="min-w-0">
                <p className="text-xs text-ink-muted">{label}</p>
                <p className={`truncate text-sm font-medium ${filled ? "text-ink" : "text-placeholder"}`}>{value}</p>
            </div>
        </div>
    );
}

export default function BookMyAppointment() {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState(null);
    const [form, setForm] = useState({ doctorId: "", date: todayStr(), timeSlot: "", reason: "" });
    const [query, setQuery] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api
            .get(ENDPOINTS.appointments.doctors)
            .then(({ data }) => setDoctors(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setDoctors([]);
            });
    }, []);

    const filteredDoctors = useMemo(() => {
        if (!doctors) return [];
        const q = query.trim().toLowerCase();
        if (!q) return doctors;
        return doctors.filter((d) =>
            `${d.name} ${d.specialization || ""}`.toLowerCase().includes(q)
        );
    }, [doctors, query]);

    const days = useMemo(() => nextDays(7), []);

    if (!doctors) return <Loader />;

    const set = (patch) => setForm((f) => ({ ...f, ...patch }));
    const selectedDoctor = doctors.find((d) => d._id === form.doctorId);

    const steps = [!!form.doctorId, !!form.date && !!form.timeSlot, !!form.reason.trim()];
    const progress = Math.round((steps.filter(Boolean).length / steps.length) * 100);

    const addReason = (tag) => {
        const current = form.reason.trim();
        if (current.toLowerCase().includes(tag.toLowerCase())) return;
        set({ reason: (current ? `${current}, ${tag}` : tag).slice(0, MAX_REASON) });
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.doctorId) return toast.error("Doctor chunein");
        if (!form.timeSlot) return toast.error("Time slot chunein");

        setSaving(true);
        try {
            await api.post(ENDPOINTS.appointments.book, {
                doctorId: form.doctorId,
                date: form.date,
                timeSlot: form.timeSlot,
                reason: form.reason || undefined,
            });
            toast.success("Appointment book ho gayi");
            navigate("/appointments");
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl">
            <Link
                to="/appointments"
                className="group mb-4 inline-flex items-center gap-1.5 text-sm text-ink-secondary transition-colors hover:text-primary-hover"
            >
                <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
                Back to appointments
            </Link>
            <PageHeader title="Book appointment" subtitle="Doctor, din aur time chunein" />

            <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-6">
                    {/* 1. Doctor */}
                    <Section
                        step={1}
                        icon={Stethoscope}
                        title="Doctor chunein"
                        hint={`${doctors.length} doctors available`}
                        done={steps[0]}
                        delay={0}
                    >
                        {doctors.length > 4 && (
                            <div className="relative mb-4">
                                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-placeholder" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Doctor ka naam ya specialization search karein"
                                    className="w-full rounded-xl border border-line-input bg-card py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-placeholder focus:border-focus focus:ring-4 focus:ring-secondary/60"
                                />
                            </div>
                        )}

                        {filteredDoctors.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-line-input bg-section px-4 py-8 text-center text-sm text-ink-muted">
                                Koi doctor nahi mila
                            </div>
                        ) : (
                            <div className="grid max-h-80 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                                {filteredDoctors.map((d) => {
                                    const active = d._id === form.doctorId;
                                    return (
                                        <button
                                            key={d._id}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => set({ doctorId: d._id, timeSlot: "" })}
                                            className={`group/doc flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60 ${active
                                                    ? "border-primary bg-lavender-light shadow-card"
                                                    : "border-line bg-card hover:border-lavender-medium hover:bg-section"
                                                }`}
                                        >
                                            <span
                                                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors duration-200 ${active
                                                        ? "bg-primary text-on-primary"
                                                        : "bg-lavender-light text-primary group-hover/doc:bg-secondary"
                                                    }`}
                                            >
                                                {initials(d.name)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-medium text-ink">Dr. {d.name}</span>
                                                {d.specialization && (
                                                    <span className="block truncate text-xs text-ink-muted">{d.specialization}</span>
                                                )}
                                            </span>
                                            <CheckCircle2
                                                size={20}
                                                className={`shrink-0 text-primary transition-all duration-200 ${active ? "scale-100 opacity-100" : "scale-50 opacity-0"
                                                    }`}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Section>

                    {/* 2. Date & time */}
                    <Section
                        step={2}
                        icon={CalendarDays}
                        title="Date aur time slot"
                        hint="Agle 7 din mein se chunein ya calendar se"
                        done={steps[1]}
                        delay={80}
                    >
                        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                            {days.map((d) => {
                                const ymd = toYMD(d);
                                const active = ymd === form.date;
                                return (
                                    <button
                                        key={ymd}
                                        type="button"
                                        onClick={() => set({ date: ymd, timeSlot: "" })}
                                        className={`flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60 ${active
                                                ? "-translate-y-0.5 border-primary bg-primary text-on-primary shadow-md shadow-primary/30"
                                                : "border-line bg-card text-ink-secondary hover:-translate-y-0.5 hover:border-lavender-medium hover:bg-section"
                                            }`}
                                    >
                                        <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                                            {d.toLocaleDateString("en-GB", { weekday: "short" })}
                                        </span>
                                        <span className="text-lg font-semibold leading-tight">{d.getDate()}</span>
                                        <span className="text-[11px] opacity-80">
                                            {d.toLocaleDateString("en-GB", { month: "short" })}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <label className="mb-5 flex flex-wrap items-center gap-3 text-sm text-ink-secondary">
                            Ya koi aur date:
                            <input
                                type="date"
                                min={todayStr()}
                                value={form.date}
                                onChange={(e) => set({ date: e.target.value, timeSlot: "" })}
                                className="rounded-xl border border-line-input bg-card px-3 py-2 text-sm text-ink outline-none transition focus:border-focus focus:ring-4 focus:ring-secondary/60"
                            />
                        </label>

                        <div className="border-t border-line-light pt-5">
                            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
                                <Clock size={16} className="text-primary" /> Available slots
                            </p>
                            {form.doctorId ? (
                                <SlotPicker
                                    doctorId={form.doctorId}
                                    date={form.date}
                                    value={form.timeSlot}
                                    onChange={(timeSlot) => set({ timeSlot })}
                                />
                            ) : (
                                <div className="rounded-xl border border-dashed border-line-input bg-section px-4 py-6 text-center text-sm text-ink-muted">
                                    Slots dekhne ke liye pehle doctor chunein
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* 3. Reason */}
                    <Section
                        step={3}
                        icon={FileText}
                        title="Wajah (optional)"
                        hint="Doctor ko pehle se pata ho to behtar ilaaj"
                        done={steps[2]}
                        delay={160}
                    >
                        <div className="mb-3 flex flex-wrap gap-2">
                            {QUICK_REASONS.map((tag) => {
                                const used = form.reason.toLowerCase().includes(tag.toLowerCase());
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => addReason(tag)}
                                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 active:scale-95 ${used
                                                ? "border-primary bg-lavender-light text-primary"
                                                : "border-line bg-card text-ink-secondary hover:border-lavender-medium hover:bg-section hover:text-primary"
                                            }`}
                                    >
                                        {used ? "✓ " : "+ "}
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative">
                            <textarea
                                rows={3}
                                maxLength={MAX_REASON}
                                value={form.reason}
                                onChange={(e) => set({ reason: e.target.value })}
                                placeholder="Masalan: bukhar aur khansi"
                                className="w-full resize-none rounded-xl border border-line-input bg-card px-4 py-2.5 pb-7 text-sm text-ink outline-none transition placeholder:text-placeholder focus:border-focus focus:ring-4 focus:ring-secondary/60"
                            />
                            <span className="pointer-events-none absolute bottom-3 right-3 text-[11px] text-ink-muted">
                                {form.reason.length}/{MAX_REASON}
                            </span>
                        </div>
                    </Section>
                </div>

                {/* Summary */}
                <aside className="lg:sticky lg:top-6 lg:self-start">
                    <div
                        style={{ animationDelay: "120ms" }}
                        className="animate-fade-up overflow-hidden rounded-2xl border border-line bg-card shadow-card"
                    >
                        <div className="bg-ai-gradient px-5 py-4 text-on-primary">
                            <p className="flex items-center gap-2 text-sm font-semibold">
                                <Sparkles size={16} /> Appointment summary
                            </p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-card/30">
                                <div
                                    className="h-full rounded-full bg-card transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-xs opacity-90">{progress}% complete</p>
                        </div>

                        <div className="space-y-1 p-3">
                            <SummaryRow
                                icon={Stethoscope}
                                label="Doctor"
                                value={selectedDoctor ? `Dr. ${selectedDoctor.name}` : "Abhi nahi chuna"}
                                filled={!!selectedDoctor}
                            />
                            <SummaryRow icon={CalendarDays} label="Date" value={prettyDate(form.date)} filled={!!form.date} />
                            <SummaryRow
                                icon={Clock}
                                label="Time"
                                value={form.timeSlot ? formatTime(form.timeSlot) : "Abhi nahi chuna"}
                                filled={!!form.timeSlot}
                            />
                            <SummaryRow
                                icon={FileText}
                                label="Wajah"
                                value={form.reason.trim() || "—"}
                                filled={!!form.reason.trim()}
                            />
                        </div>

                        <div className="space-y-2 border-t border-line-light p-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-md shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-hover active:translate-y-0 active:bg-primary-active disabled:pointer-events-none disabled:opacity-60"
                            >
                                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-card/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {saving ? "Booking..." : "Book appointment"}
                            </button>
                            <Link
                                to="/appointments"
                                className="block w-full rounded-xl border border-line bg-card px-5 py-2.5 text-center text-sm font-medium text-ink-secondary transition-colors hover:border-lavender-medium hover:bg-section hover:text-primary"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                </aside>
            </form>
        </div>
    );
}