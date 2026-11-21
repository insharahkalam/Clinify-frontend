import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    CalendarDays,
    CalendarPlus,
    CheckCircle2,
    ChevronRight,
    Clock,
    Download,
    FileText,
    FlaskConical,
    Pill,
    Sparkles,
    TrendingUp,
    Upload,
    UserRound,
    X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";

/* ------------------------------------------------------------------
   Apne app ke routes yahan set karein
------------------------------------------------------------------- */
const LINKS = {
    book: "/patient/appointments/book",
    appointments: "/patient/appointments",
    records: "/patient/records",
    upload: "/patient/reports",
    profile: "/patient/profile",
};

const ACTIVE_STATUSES = ["pending", "confirmed"];

const STATUS = {
    pending: { label: "Pending", cls: "bg-warning-bg text-warning", dot: "bg-warning" },
    confirmed: { label: "Confirmed", cls: "bg-success-bg text-success", dot: "bg-success" },
    completed: { label: "Completed", cls: "bg-info-bg text-info", dot: "bg-info" },
    cancelled: { label: "Cancelled", cls: "bg-danger-bg text-danger", dot: "bg-danger" },
};
const FALLBACK_STATUS = { label: "Scheduled", cls: "bg-section text-ink-secondary", dot: "bg-ink-muted" };

const STAT_CARDS = [
    { key: "upcoming", label: "Upcoming visits", hint: "Pending & confirmed", icon: CalendarDays },
    { key: "prescriptions", label: "Prescriptions", hint: "Written by your doctors", icon: Pill },
    { key: "reports", label: "Lab reports", hint: "Uploaded to your file", icon: FlaskConical },
    { key: "completed", label: "Completed visits", hint: "Consultations done", icon: CheckCircle2 },
];

const QUICK_ACTIONS = [
    { label: "Book appointment", hint: "Find a free slot", icon: CalendarPlus, href: LINKS.book },
    { label: "Upload report", hint: "PDF or image", icon: Upload, href: LINKS.upload },
    { label: "Prescriptions", hint: "Your medicines", icon: Pill, href: LINKS.records },
    { label: "My profile", hint: "Health details", icon: UserRound, href: LINKS.profile },
];

const TIPS = [
    "Upload your latest reports so your doctor sees the full picture.",
    "Arrive 10 minutes early for your appointment.",
    "Keep your medical details up to date in your profile.",
    "Take your medicines at the same time every day — set a reminder.",
    "Note down your symptoms before a visit so nothing gets missed.",
];

/* ------------------------------------------------------------------
   Helpers
------------------------------------------------------------------- */
const pad = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Any date value -> "YYYY-MM-DD"
function toKey(value) {
    if (!value) return "";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : dateKey(d);
}

function parseKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function formatDay(key, options) {
    return key ? parseKey(key).toLocaleDateString("en-US", options) : "—";
}

function relativeDay(key, todayKey) {
    if (!key || !todayKey) return "";
    const diff = Math.round((parseKey(key) - parseKey(todayKey)) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return diff > 1 ? `In ${diff} days` : `${-diff} days ago`;
}

// "10:30 AM" / "14:00" -> minutes, for sorting
function timeToMinutes(time) {
    const match = /(\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(time || "");
    if (!match) return 0;
    let hours = Number(match[1]) % 12;
    if (!match[3] && Number(match[1]) === 12) hours = 12;
    if (match[3]?.toLowerCase() === "pm") hours += 12;
    return hours * 60 + Number(match[2]);
}

const doctorOf = (item) => {
    const d = item?.doctor ?? item?.doctorId;
    return d && typeof d === "object" ? d : {};
};

function doctorName(item) {
    const d = doctorOf(item);
    const name = d.name || d.user?.name || item?.doctorName || "";
    if (!name) return "Your doctor";
    return /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

const specialtyOf = (item) =>
    doctorOf(item).specialization || doctorOf(item).specialty || item?.specialization || "General consultation";

const timeOf = (a) => a?.time || a?.timeSlot || a?.slot || "";
const idOf = (item, i) => item?._id || item?.id || i;

function initials(name) {
    return name
        .replace(/^dr\.?\s*/i, "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");
}

function greetingFor(hour) {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

/* ------------------------------------------------------------------
   Hooks
------------------------------------------------------------------- */
function useNow(intervalMs = 30000) {
    const [now, setNow] = useState(null);
    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);
    return now;
}

// Counts up from 0 to the target number.
function useCountUp(target, duration = 900) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (target === null) return;
        let frame = 0;
        const start = performance.now();
        const tick = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);
    return value;
}

/* ------------------------------------------------------------------
   Small building blocks
------------------------------------------------------------------- */
function Panel({ title, subtitle, action, children, delay = 0 }) {
    return (
        <section
            className="animate-fade-up rounded-3xl border border-line bg-card p-5 shadow-card sm:p-6"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-ink">{title}</h2>
                    {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function ViewAll({ href, label = "View all" }) {
    return (
        <a
            href={href}
            className="group inline-flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition hover:bg-lavender-light"
        >
            {label}
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </a>
    );
}

function Tabs({ tabs, value, onChange }) {
    return (
        <div role="tablist" className="inline-flex rounded-xl bg-section p-1">
            {tabs.map((t) => {
                const active = value === t.value;
                return (
                    <button
                        key={t.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(t.value)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${active ? "bg-card text-primary shadow-card" : "text-ink-secondary hover:text-ink"
                            }`}
                    >
                        {t.label}
                        {t.count !== undefined && (
                            <span
                                className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-lavender-light text-primary" : "bg-card text-ink-muted"
                                    }`}
                            >
                                {t.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

function EmptyState({ icon: Icon, title, text, action }) {
    return (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-lavender-soft px-6 py-10 text-center">
            <div className="grid h-12 w-12 animate-float place-items-center rounded-2xl bg-card text-primary shadow-card">
                <Icon size={22} />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
            <p className="mt-1 max-w-xs text-xs text-ink-muted">{text}</p>
            {action}
        </div>
    );
}

function SkeletonRows({ rows = 3 }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl p-3">
                    <div className="h-12 w-12 rounded-xl bg-lavender-light" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded bg-lavender-light" />
                        <div className="h-2.5 w-1/3 rounded bg-section" />
                    </div>
                </div>
            ))}
        </div>
    );
}

const primaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-card transition-all hover:bg-primary-hover hover:shadow-hover active:scale-95 active:bg-primary-active";
const outlineBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:border-secondary hover:bg-lavender-soft hover:text-primary active:scale-95";

/* ------------------------------------------------------------------
   Header with greeting + week strip
------------------------------------------------------------------- */
function WeekStrip({ now, selectedDay, onSelectDay, appointmentDays }) {
    if (!now) return <div className="h-32 animate-pulse rounded-2xl bg-section" />;

    const days = Array.from(
        { length: 7 },
        (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    );

    return (
        <div className="rounded-2xl border border-line-light bg-section p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">Next 7 days</p>
                <p className="text-[11px] text-ink-muted">
                    {selectedDay ? "Tap again to clear" : "Tap a day to filter"}
                </p>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
                {days.map((d, i) => {
                    const key = dateKey(d);
                    const active = selectedDay === key;
                    const count = appointmentDays[key] || 0;
                    return (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={active}
                            aria-label={`${d.toDateString()}${count ? `, ${count} appointment(s)` : ""}`}
                            onClick={() => onSelectDay(active ? null : key)}
                            className={`flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all duration-200 active:scale-95 ${active
                                ? "bg-primary text-on-primary shadow-hover"
                                : `bg-card text-ink hover:-translate-y-0.5 hover:shadow-card ${i === 0 ? "ring-1 ring-primary" : ""}`
                                }`}
                        >
                            <span
                                className={`text-[10px] font-semibold uppercase ${active ? "text-on-primary" : "text-ink-muted"}`}
                            >
                                {d.toLocaleDateString("en-US", { weekday: "short" })}
                            </span>
                            <span className="text-lg font-bold leading-none tabular-nums">{d.getDate()}</span>
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${count ? (active ? "bg-card" : "bg-primary") : "bg-transparent"}`}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function Hero({ user, now, todayKey, upcoming, selectedDay, onSelectDay, appointmentDays }) {
    const firstName = (user?.name || "").split(" ")[0] || "there";
    const next = upcoming[0];

    let summary = "Here's your health overview for today.";
    if (todayKey) {
        summary =
            upcoming.length === 0
                ? "No upcoming visits — book one whenever you need."
                : `You have ${upcoming.length} upcoming ${upcoming.length === 1 ? "visit" : "visits"} · next one ${relativeDay(
                    toKey(next.date),
                    todayKey
                ).toLowerCase()}.`;
    }

    return (
        <section className="relative animate-fade-up overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-card sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 animate-blob rounded-full bg-lavender-light blur-3xl" />
            <div
                className="pointer-events-none absolute -bottom-28 left-1/4 h-60 w-60 animate-blob rounded-full bg-lavender-medium opacity-40 blur-3xl"
                style={{ animationDelay: "-4s" }}
            />

            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender-light px-3 py-1 text-xs font-semibold text-primary">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                            Patient
                        </span>
                        {now && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-ink-secondary">
                                <Clock size={12} />
                                {now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                                <span className="text-ink-muted">·</span>
                                <span className="tabular-nums">
                                    {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </span>
                            </span>
                        )}
                    </div>

                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
                        {now ? greetingFor(now.getHours()) : "Hello"}, {firstName}{" "}
                        <span className="inline-block origin-[70%_70%] animate-wave">👋</span>
                    </h1>
                    <p className="mt-2 max-w-md text-sm text-ink-secondary sm:text-base">{summary}</p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <a href={LINKS.book} className={primaryBtn}>
                            <CalendarPlus size={16} />
                            Book appointment
                        </a>
                        <a href={LINKS.upload} className={outlineBtn}>
                            <Upload size={16} />
                            Upload report
                        </a>
                    </div>
                </div>

                <WeekStrip
                    now={now}
                    selectedDay={selectedDay}
                    onSelectDay={onSelectDay}
                    appointmentDays={appointmentDays}
                />
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------
   Stat cards
------------------------------------------------------------------- */
function StatCard({ card, value, index, loading }) {
    const Icon = card.icon;
    const numeric = typeof value === "number" ? value : null;
    const counted = useCountUp(loading ? null : numeric);

    // Moves the soft glow to follow the cursor.
    const onMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
    };

    return (
        <div
            onMouseMove={onMove}
            className="group relative animate-fade-up overflow-hidden rounded-2xl border border-line bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:shadow-hover sm:p-5"
            style={{ animationDelay: `${120 + index * 80}ms` }}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background:
                        "radial-gradient(220px circle at var(--x, 50%) var(--y, 50%), var(--lavender-light), transparent 70%)",
                }}
            />
            <div className="relative">
                <div className="mb-4 flex items-start justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-lavender-light text-primary transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary">
                        <Icon size={20} />
                    </div>
                    <TrendingUp
                        size={16}
                        className="text-ink-muted opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:opacity-100"
                    />
                </div>
                <p className="text-xs font-medium text-ink-secondary sm:text-sm">{card.label}</p>
                {loading ? (
                    <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-lavender-light" />
                ) : (
                    <p className="mt-1 text-2xl font-bold tabular-nums text-ink sm:text-3xl">
                        {numeric !== null ? counted.toLocaleString() : "—"}
                    </p>
                )}
                <p className="mt-1 hidden text-xs text-ink-muted sm:block">{card.hint}</p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------
   Next appointment highlight
------------------------------------------------------------------- */
function NextAppointment({ appt, todayKey, loading }) {
    if (loading) return <div className="h-60 animate-pulse rounded-3xl bg-lavender-light" />;

    if (!appt) {
        return (
            <Panel title="Next appointment" delay={200}>
                <EmptyState
                    icon={CalendarPlus}
                    title="Nothing scheduled yet"
                    text="Book a visit with a doctor and it will show up here."
                    action={
                        <a href={LINKS.book} className={`${primaryBtn} mt-5`}>
                            Book appointment
                        </a>
                    }
                />
            </Panel>
        );
    }

    const key = toKey(appt.date);
    const status = STATUS[appt.status] || FALLBACK_STATUS;
    const name = doctorName(appt);
    const time = timeOf(appt);

    return (
        <section
            className="group relative animate-fade-up overflow-hidden rounded-3xl bg-primary p-6 text-on-primary shadow-hover sm:p-7"
            style={{ animationDelay: "200ms" }}
        >
            <div className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full bg-card/10 transition-transform duration-700 group-hover:scale-125" />
            <div className="pointer-events-none absolute -bottom-20 right-28 h-44 w-44 rounded-full bg-card/10 transition-transform duration-700 group-hover:-translate-x-8" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-card text-xl font-bold text-primary shadow-card transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                        {initials(name) || "DR"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-on-primary/80">
                            Next appointment · {relativeDay(key, todayKey)}
                        </p>
                        <h2 className="mt-1 truncate text-xl font-bold sm:text-2xl">{name}</h2>
                        <p className="truncate text-sm text-on-primary/80">{specialtyOf(appt)}</p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 self-start rounded-2xl bg-card/15 px-5 py-3 backdrop-blur-sm sm:self-auto">
                    <div className="text-center leading-none">
                        <p className="text-[11px] font-semibold uppercase text-on-primary/80">
                            {formatDay(key, { month: "short" })}
                        </p>
                        <p className="mt-1 text-3xl font-bold tabular-nums">{formatDay(key, { day: "numeric" })}</p>
                    </div>
                    <div className="h-10 w-px bg-card/30" />
                    <div className="leading-tight">
                        <p className="text-sm font-semibold">{formatDay(key, { weekday: "long" })}</p>
                        <p className="text-xs text-on-primary/80">{time || "Time to be confirmed"}</p>
                    </div>
                </div>
            </div>

            <div className="relative mt-6 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/15 px-3 py-1.5 text-xs font-medium">
                    <CalendarDays size={13} />
                    {formatDay(key, { day: "numeric", month: "long", year: "numeric" })}
                </span>
                {time && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-card/15 px-3 py-1.5 text-xs font-medium">
                        <Clock size={13} />
                        {time}
                    </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-primary">
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                </span>
                <a
                    href={LINKS.appointments}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-card px-4 py-2 text-sm font-semibold text-primary transition-all hover:gap-2.5 hover:shadow-card active:scale-95"
                >
                    View details
                    <ArrowRight size={16} />
                </a>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------
   Appointments list
------------------------------------------------------------------- */
function AppointmentRow({ appt, open, onToggle, todayKey }) {
    const key = toKey(appt.date);
    const status = STATUS[appt.status] || FALLBACK_STATUS;
    const time = timeOf(appt);
    const reason = appt.reason || appt.notes || appt.symptoms;

    return (
        <li
            className={`rounded-2xl border transition-all duration-200 ${open ? "border-secondary bg-lavender-soft" : "border-transparent hover:border-line hover:bg-section"
                }`}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="flex w-full items-center gap-3 p-3 text-left"
            >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lavender-light text-primary">
                    <div className="text-center leading-none">
                        <p className="text-[10px] font-semibold uppercase">{formatDay(key, { month: "short" })}</p>
                        <p className="mt-0.5 text-lg font-bold tabular-nums">{formatDay(key, { day: "numeric" })}</p>
                    </div>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{doctorName(appt)}</p>
                    <p className="truncate text-xs text-ink-muted">
                        {specialtyOf(appt)}
                        {time && ` · ${time}`}
                    </p>
                </div>
                <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${status.cls}`}>
                    {status.label}
                </span>
                <ChevronRight
                    size={16}
                    className={`shrink-0 transition-transform duration-200 ${open ? "rotate-90 text-primary" : "text-ink-muted"}`}
                />
            </button>

            <div
                className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="mx-3 mb-3 grid gap-3 rounded-xl bg-card p-3 text-xs sm:grid-cols-3">
                        <div>
                            <p className="text-ink-muted">Date</p>
                            <p className="mt-0.5 font-semibold text-ink">
                                {formatDay(key, { weekday: "short", day: "numeric", month: "short" })}
                                <span className="font-normal text-ink-muted"> · {relativeDay(key, todayKey)}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-ink-muted">Time</p>
                            <p className="mt-0.5 font-semibold text-ink">{time || "To be confirmed"}</p>
                        </div>
                        <div>
                            <p className="text-ink-muted">Status</p>
                            <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 font-semibold ${status.cls}`}>
                                {status.label}
                            </span>
                        </div>
                        {reason && (
                            <div className="sm:col-span-3">
                                <p className="text-ink-muted">Reason</p>
                                <p className="mt-0.5 text-ink-secondary">{reason}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
}

function AppointmentsPanel({ upcoming, past, loading, selectedDay, onClearDay, todayKey }) {
    const [tab, setTab] = useState("upcoming");
    const [openId, setOpenId] = useState(null);

    const list = useMemo(() => {
        if (selectedDay) return [...upcoming, ...past].filter((a) => toKey(a.date) === selectedDay);
        return tab === "upcoming" ? upcoming : past;
    }, [selectedDay, tab, upcoming, past]);

    const shown = list.slice(0, 5);

    return (
        <Panel
            title="Appointments"
            subtitle="Tap a visit to see its details"
            action={<ViewAll href={LINKS.appointments} />}
            delay={280}
        >
            <div className="mb-4 flex flex-wrap items-center gap-2">
                {selectedDay ? (
                    <button
                        type="button"
                        onClick={onClearDay}
                        className="inline-flex items-center gap-1.5 rounded-full bg-lavender-light px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-secondary active:scale-95"
                    >
                        Showing {formatDay(selectedDay, { weekday: "short", day: "numeric", month: "short" })}
                        <X size={12} />
                    </button>
                ) : (
                    <Tabs
                        value={tab}
                        onChange={(v) => {
                            setTab(v);
                            setOpenId(null);
                        }}
                        tabs={[
                            { value: "upcoming", label: "Upcoming", count: upcoming.length },
                            { value: "past", label: "History", count: past.length },
                        ]}
                    />
                )}
            </div>

            {loading ? (
                <SkeletonRows />
            ) : shown.length === 0 ? (
                <EmptyState
                    icon={CalendarDays}
                    title={selectedDay ? "No visits on this day" : tab === "upcoming" ? "No upcoming visits" : "No history yet"}
                    text={
                        selectedDay
                            ? "Pick another day or clear the filter."
                            : tab === "upcoming"
                                ? "When you book an appointment it will appear here."
                                : "Your past and cancelled visits will be listed here."
                    }
                />
            ) : (
                <ul key={selectedDay || tab} className="animate-fade-up space-y-1.5">
                    {shown.map((a, i) => {
                        const id = idOf(a, i);
                        return (
                            <AppointmentRow
                                key={id}
                                appt={a}
                                todayKey={todayKey}
                                open={openId === id}
                                onToggle={() => setOpenId(openId === id ? null : id)}
                            />
                        );
                    })}
                </ul>
            )}
        </Panel>
    );
}

/* ------------------------------------------------------------------
   Right column: tips, quick actions, records
------------------------------------------------------------------- */
function TipsBanner() {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        if (paused || hidden) return;
        const timer = setInterval(() => setIndex((i) => (i + 1) % TIPS.length), 5000);
        return () => clearInterval(timer);
    }, [paused, hidden]);

    if (hidden) return null;

    return (
        <div
            className="relative animate-fade-up overflow-hidden rounded-3xl bg-ai-gradient p-5 text-on-primary shadow-card"
            style={{ animationDelay: "200ms" }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 animate-blob rounded-full bg-card opacity-20 blur-2xl" />
            <div className="relative flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 animate-float place-items-center rounded-xl bg-card text-primary">
                    <Sparkles size={18} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider">AI health tip</p>
                    <p key={index} className="mt-1 min-h-[2.5rem] animate-fade-up text-sm font-medium">
                        {TIPS[index]}
                    </p>
                    <div className="mt-3 flex gap-1.5">
                        {TIPS.map((tip, i) => (
                            <button
                                key={tip}
                                type="button"
                                aria-label={`Show tip ${i + 1}`}
                                onClick={() => setIndex(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-card" : "w-1.5 bg-card opacity-50 hover:opacity-100"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
                <button
                    type="button"
                    aria-label="Hide tips"
                    onClick={() => setHidden(true)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition hover:bg-card hover:text-primary active:scale-90"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

function QuickActions() {
    return (
        <Panel title="Quick actions" delay={280}>
            <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                        <a
                            key={action.label}
                            href={action.href}
                            className="group rounded-2xl border border-line bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:bg-lavender-soft hover:shadow-hover active:scale-[0.98]"
                        >
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-lavender-light text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary">
                                <Icon size={18} />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-ink">{action.label}</p>
                            <p className="text-xs text-ink-muted">{action.hint}</p>
                        </a>
                    );
                })}
            </div>
        </Panel>
    );
}

function RecordsPanel({ prescriptions, reports, loading }) {
    const [tab, setTab] = useState("all");

    const records = useMemo(
        () =>
            [
                ...prescriptions.map((p, i) => {
                    const meds = Array.isArray(p.medicines) ? p.medicines.length : 0;
                    return {
                        id: `rx-${idOf(p, i)}`,
                        type: "prescription",
                        title: p.diagnosis || p.title || "Prescription",
                        meta: meds ? `${doctorName(p)} · ${meds} ${meds === 1 ? "medicine" : "medicines"}` : doctorName(p),
                        date: toKey(p.createdAt || p.date),
                        url: null,
                    };
                }),
                ...reports.map((r, i) => ({
                    id: `rp-${idOf(r, i)}`,
                    type: "report",
                    title: r.title || r.name || r.reportType || r.type || "Medical report",
                    meta: r.lab || r.category || "Lab report",
                    date: toKey(r.createdAt || r.date || r.uploadedAt),
                    url: r.fileUrl || r.url || null,
                })),
            ].sort((a, b) => (b.date || "").localeCompare(a.date || "")),
        [prescriptions, reports]
    );

    const shown = records.filter((r) => tab === "all" || r.type === tab).slice(0, 4);

    return (
        <Panel title="Medical records" subtitle="Latest prescriptions & reports" action={<ViewAll href={LINKS.records} />} delay={360}>
            <div className="mb-4">
                <Tabs
                    value={tab}
                    onChange={setTab}
                    tabs={[
                        { value: "all", label: "All", count: records.length },
                        { value: "prescription", label: "Rx", count: prescriptions.length },
                        { value: "report", label: "Reports", count: reports.length },
                    ]}
                />
            </div>

            {loading ? (
                <SkeletonRows rows={3} />
            ) : shown.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No records yet"
                    text="Prescriptions from your doctor and uploaded reports will appear here."
                    action={
                        <a href={LINKS.upload} className={`${outlineBtn} mt-5`}>
                            <Upload size={16} />
                            Upload report
                        </a>
                    }
                />
            ) : (
                <ul key={tab} className="animate-fade-up space-y-1.5">
                    {shown.map((r) => {
                        const isRx = r.type === "prescription";
                        const Icon = isRx ? Pill : FlaskConical;
                        return (
                            <li key={r.id}>
                                <a
                                    href={r.url || LINKS.records}
                                    target={r.url ? "_blank" : undefined}
                                    rel={r.url ? "noreferrer" : undefined}
                                    className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition-all hover:border-line hover:bg-section"
                                >
                                    <div
                                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${isRx ? "bg-lavender-light text-primary" : "bg-info-bg text-info"
                                            }`}
                                    >
                                        <Icon size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-ink">{r.title}</p>
                                        <p className="truncate text-xs text-ink-muted">
                                            {r.meta}
                                            {r.date && ` · ${formatDay(r.date, { day: "numeric", month: "short" })}`}
                                        </p>
                                    </div>
                                    {r.url ? (
                                        <Download size={16} className="shrink-0 text-ink-muted transition group-hover:text-primary" />
                                    ) : (
                                        <ChevronRight
                                            size={16}
                                            className="shrink-0 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-primary"
                                        />
                                    )}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Panel>
    );
}

/* ------------------------------------------------------------------
   Main view
------------------------------------------------------------------- */
function PatientDashboardView({
    user,
    appointments = [],
    prescriptions = [],
    reports = [],
    loading = false,
}) {
    const now = useNow();
    const todayKey = now ? dateKey(now) : "";
    const isLoading = loading || !now;
    const [selectedDay, setSelectedDay] = useState(null);

    const { upcoming, past } = useMemo(() => {
        const up = [];
        const pa = [];
        appointments.forEach((a) => {
            const key = toKey(a.date);
            if (key && key >= todayKey && ACTIVE_STATUSES.includes(a.status)) up.push(a);
            else pa.push(a);
        });
        up.sort(
            (x, y) =>
                toKey(x.date).localeCompare(toKey(y.date)) || timeToMinutes(timeOf(x)) - timeToMinutes(timeOf(y))
        );
        pa.sort((x, y) => toKey(y.date).localeCompare(toKey(x.date)));
        return { upcoming: up, past: pa };
    }, [appointments, todayKey]);

    const appointmentDays = useMemo(() => {
        const map = {};
        upcoming.forEach((a) => {
            const key = toKey(a.date);
            map[key] = (map[key] || 0) + 1;
        });
        return map;
    }, [upcoming]);

    const stats = {
        upcoming: upcoming.length,
        prescriptions: prescriptions.length,
        reports: reports.length,
        completed: appointments.filter((a) => a.status === "completed").length,
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <Hero
                user={user}
                now={now}
                todayKey={todayKey}
                upcoming={upcoming}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                appointmentDays={appointmentDays}
            />

            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {STAT_CARDS.map((card, i) => (
                    <StatCard key={card.key} card={card} value={stats[card.key]} index={i} loading={isLoading} />
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <NextAppointment appt={upcoming[0]} todayKey={todayKey} loading={isLoading} />
                    <AppointmentsPanel
                        upcoming={upcoming}
                        past={past}
                        loading={isLoading}
                        todayKey={todayKey}
                        selectedDay={selectedDay}
                        onClearDay={() => setSelectedDay(null)}
                    />
                </div>

                <div className="space-y-6">
                    <TipsBanner />
                    <QuickActions />
                    <RecordsPanel prescriptions={prescriptions} reports={reports} loading={isLoading} />
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------
   Page: data fetch (same API calls as before)
------------------------------------------------------------------- */
export default function PatientDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState({ appointments: [], prescriptions: [], reports: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        // Koi ek call fail bhi ho to baaqi data dikhta rahe
        Promise.allSettled([
            api.get(ENDPOINTS.appointments.my),
            api.get(ENDPOINTS.patient.prescriptions),
            api.get(ENDPOINTS.reports.base),
        ]).then(([appts, rx, reports]) => {
            if (!active) return;
            const list = (r) => (r.status === "fulfilled" && Array.isArray(r.value.data) ? r.value.data : []);
            setData({
                appointments: list(appts),
                prescriptions: list(rx),
                reports: list(reports),
            });
            setLoading(false);
        });

        return () => {
            active = false;
        };
    }, []);

    return <PatientDashboardView user={user} {...data} loading={loading} />;
}