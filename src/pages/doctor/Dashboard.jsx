import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Activity,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock,
    FilePlus2,
    FileText,
    RefreshCw,
    Search,
    Sparkles,
    Stethoscope,
    Users,
} from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { errMsg, formatDay, formatTime, formatWeekday, todayStr } from "../../utils/format";
import StatusBadge from "../../components/StatusBadge";

/* ------------------------------------------------------------------ */
/*  Theme helpers (MediSync tokens)                                    */
/* ------------------------------------------------------------------ */
const card =
    "min-w-0 rounded-2xl border border-line-light bg-card p-6 shadow-card transition duration-300 hover:shadow-hover";
const tick = { fill: "#756B99", fontSize: 12 };
const focusRing =
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25";
const delay = (ms) => ({ animationDelay: `${ms}ms` });

const TONES = {
    primary: "bg-lavender-light text-lavender-deep",
    info: "bg-info-bg text-info",
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
};

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */
function useCountUp(target, duration = 900) {
    const [val, setVal] = useState(0);

    useEffect(() => {
        if (typeof target !== "number") return;
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
            setVal(target);
            return;
        }
        let raf;
        let start;
        const step = (t) => {
            start ??= t;
            const p = Math.min((t - start) / duration, 1);
            setVal(Math.round(target * (1 - Math.pow(1 - p, 3)))); // easeOutCubic
            if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);

    return typeof target === "number" ? val : target;
}

function useClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(id);
    }, []);
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------------------------------------------ */
/*  Small components                                                   */
/* ------------------------------------------------------------------ */
function Skeleton({ className = "" }) {
    return <div className={`animate-pulse rounded-xl bg-lavender-light/70 ${className}`} />;
}

function DashboardSkeleton() {
    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <Skeleton className="h-52 rounded-3xl" />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, hint, tone = "primary", delayMs = 0 }) {
    const shown = useCountUp(value);

    return (
        <div
            className="animate-fade-up group relative overflow-hidden rounded-2xl border border-line-light bg-card p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-hover"
            style={delay(delayMs)}
        >
            {/* decorative circle */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-lavender-soft transition-transform duration-500 group-hover:scale-150" />

            <div className="relative flex items-start justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-secondary">{label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-ink tabular-nums">{shown}</p>
                </div>
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition duration-300 group-hover:rotate-6 group-hover:scale-110 ${TONES[tone]}`}
                >
                    <Icon size={20} />
                </div>
            </div>

            {hint && <p className="relative mt-3 truncate text-xs text-ink-muted">{hint}</p>}
        </div>
    );
}

function Segmented({ value, onChange, options }) {
    return (
        <div className="inline-flex rounded-lg bg-section p-1">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition ${focusRing} ${value === o.value
                        ? "bg-card text-lavender-deep shadow-sm"
                        : "text-ink-secondary hover:text-ink"
                        }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function DoctorDashboard() {
    const { user } = useAuth();
    const today = todayStr();
    const clock = useClock();

    const [appts, setAppts] = useState(null);
    const [stats, setStats] = useState(null); // null = loading, false = failed
    const [hovered, setHovered] = useState(null);
    const [retrying, setRetrying] = useState(false);
    const [chartType, setChartType] = useState("bar");
    const [q, setQ] = useState("");

    const loadStats = useCallback(() => {
        setRetrying(true);
        return api
            .get(ENDPOINTS.analytics.doctor)
            .then(({ data }) => setStats(data))
            .catch(() => setStats(false))
            .finally(() => setRetrying(false));
    }, []);

    useEffect(() => {
        api
            .get(ENDPOINTS.appointments.schedule, { params: { date: today } })
            .then(({ data }) => setAppts(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setAppts([]);
            });
        loadStats();
    }, [today, loadStats]);

    const { active, queue, completed, progress } = useMemo(() => {
        const list = appts || [];
        const activeList = list.filter((a) => a.status !== "cancelled");
        const queueList = activeList.filter((a) => a.status !== "completed");
        const done = activeList.length - queueList.length;
        return {
            active: activeList,
            queue: queueList,
            completed: done,
            progress: activeList.length ? Math.round((done / activeList.length) * 100) : 0,
        };
    }, [appts]);

    const chart = useMemo(
        () => (stats ? stats.last7Days.map((d) => ({ label: formatWeekday(d.date), count: d.count })) : []),
        [stats]
    );

    const insights = useMemo(() => {
        const total = chart.reduce((s, d) => s + d.count, 0);
        const peak = chart.reduce((best, d) => (d.count > (best?.count ?? -1) ? d : best), null);
        return {
            total,
            avg: chart.length ? (total / chart.length).toFixed(1) : "0",
            peak: total > 0 && peak ? peak.label : "—",
        };
    }, [chart]);

    if (!appts || stats === null) return <DashboardSkeleton />;

    const next = queue[0];
    const rest = queue.slice(1);
    const filteredRest = q.trim()
        ? rest.filter((a) => (a.patient?.user?.name || "").toLowerCase().includes(q.trim().toLowerCase()))
        : rest;

    const statCards = [
        { label: "Today's appointments", value: stats ? stats.todayAppointments : active.length, icon: CalendarDays, tone: "primary" },
        {
            label: "This month",
            value: stats ? stats.thisMonth.total : "—",
            icon: Activity,
            tone: "info",
            hint: stats ? `${stats.thisMonth.completed} completed • ${stats.thisMonth.cancelled} cancelled` : undefined,
        },
        { label: "Patients treated", value: stats ? stats.patientsTreated : "—", icon: Users, tone: "success" },
        {
            label: "Prescriptions (this month)",
            value: stats ? stats.prescriptions.thisMonth : "—",
            icon: FileText,
            tone: "warning",
            hint: stats ? `Total: ${stats.prescriptions.total}` : undefined,
        },
    ];

    const heroChips = [
        { label: "Waiting", value: queue.length },
        { label: "Completed", value: completed },
        { label: "Next", value: next ? formatTime(next.timeSlot) : "—" },
    ];

    const sharedAxes = (
        <>
            <CartesianGrid vertical={false} stroke="#E6DFF5" strokeDasharray="4 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={tick} />
            <Tooltip
                cursor={chartType === "bar" ? { fill: "#F3EEFD" } : { stroke: "#D9CCF5", strokeWidth: 1.5 }}
                contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E6DFF5",
                    boxShadow: "0 8px 25px rgba(143,120,191,0.14)",
                }}
                formatter={(v) => [v, "Appointments"]}
            />
        </>
    );

    return (
        <div className="mx-auto max-w-6xl">
            {/* ---------- Hero ---------- */}
            <section className="animate-fade-up relative mb-6 overflow-hidden rounded-3xl bg-ai-gradient p-7 text-white shadow-card sm:p-9">
                <div className="animate-blob pointer-events-none absolute -right-10 -top-12 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
                <div
                    className="animate-blob pointer-events-none absolute -bottom-16 right-1/3 h-44 w-44 rounded-full bg-lavender-light/30 blur-2xl"
                    style={delay(2500)}
                />

                <div className="animate-float pointer-events-none absolute right-6 top-8 hidden sm:block md:right-12">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 shadow-hover ring-1 ring-white/40 backdrop-blur-sm">
                        <Stethoscope size={38} />
                    </div>
                </div>

                <div className="relative">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-white/85">
                        <span>{formatDay(today)}</span>
                        <span className="h-1 w-1 rounded-full bg-white/60" />
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <Clock size={14} /> {clock}
                        </span>
                    </div>

                    <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                        {greeting()}, Dr. {user.name}{" "}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm text-white/90">
                        {queue.length > 0
                            ? `You have ${queue.length} patient${queue.length > 1 ? "s" : ""} waiting today.`
                            : active.length > 0
                                ? "You've seen everyone for today. Great work!"
                                : "No appointments scheduled for today."}
                    </p>

                    <div className="mt-5 flex justify-between">
                        <div className="flex gap-2.5"> {heroChips.map((c) => (
                            <div
                                key={c.label}
                                className="rounded-xl bg-white/15 px-4 py-2 ring-1 ring-white/30 backdrop-blur-sm"
                            >
                                <p className="text-[11px] font-serif font-bold uppercase tracking-wider text-white">{c.label}</p>
                                <p className="text-lg font-bold leading-tight tabular-nums">{c.value}</p>
                            </div>
                        ))}
                        </div>

                        <div className=" flex gap-3">
                            <Link
                                to="/symptom-checker"
                                className={`group inline-flex items-center gap-2 font-serif rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ai-primary shadow-md transition hover:-translate-y-0.5 hover:shadow-hover active:translate-y-0 ${focusRing}`}
                            >
                                AI symptom checker
                            </Link>
                            <Link
                                to="/appointments"
                                className={`group inline-flex items-center gap-2 font-serif rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ai-primary shadow-md transition hover:-translate-y-0.5 hover:shadow-hover active:translate-y-0 ${focusRing}`}
                            >
                                Appointments <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>


                </div>
            </section>

            {/* ---------- Stats ---------- */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((s, i) => (
                    <StatCard key={s.label} {...s} delayMs={120 + i * 90} />
                ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* ---------- Chart ---------- */}
                <div className={`${card} animate-fade-up lg:col-span-2`} style={delay(480)}>
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="font-semibold text-ink">Appointments, last 7 days</h2>
                            <p className="mt-0.5 text-xs text-ink-muted">Hover over the chart to see the daily count</p>
                        </div>
                        {stats && (
                            <Segmented
                                value={chartType}
                                onChange={setChartType}
                                options={[
                                    { value: "bar", label: "Bars" },
                                    { value: "area", label: "Trend" },
                                ]}
                            />
                        )}
                    </div>

                    {stats && (
                        <div className="mb-4 grid grid-cols-3 gap-3">
                            {[
                                { label: "Total", value: insights.total },
                                { label: "Daily average", value: insights.avg },
                                { label: "Busiest day", value: insights.peak },
                            ].map((i) => (
                                <div key={i.label} className="rounded-xl bg-section px-3.5 py-2.5">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{i.label}</p>
                                    <p className="text-lg font-bold text-lavender-deep tabular-nums">{i.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {!stats ? (
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-section py-14 text-center">
                            <p className="text-sm text-ink-secondary">Could not load the chart.</p>
                            <button
                                onClick={loadStats}
                                disabled={retrying}
                                className={`inline-flex items-center gap-2 rounded-lg border border-input-line bg-card px-4 py-2 text-xs font-semibold text-lavender-deep transition hover:bg-lavender-soft disabled:opacity-60 ${focusRing}`}
                            >
                                <RefreshCw size={14} className={retrying ? "animate-spin" : ""} />
                                Try again
                            </button>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            {chartType === "bar" ? (
                                <BarChart
                                    data={chart}
                                    margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                                    onMouseMove={(s) => setHovered(s?.isTooltipActive ? s.activeTooltipIndex : null)}
                                    onMouseLeave={() => setHovered(null)}
                                >
                                    {sharedAxes}
                                    <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={40} animationDuration={800}>
                                        {chart.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={hovered === null || hovered === i ? "#8F78BF" : "#D9CCF5"}
                                                style={{ transition: "fill 150ms" }}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <AreaChart data={chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8F78BF" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#8F78BF" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    {sharedAxes}
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#8F78BF"
                                        strokeWidth={2.5}
                                        fill="url(#areaFill)"
                                        activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                                        animationDuration={800}
                                    />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    )}
                </div>

                {/* ---------- Queue ---------- */}
                <div className={`${card} animate-fade-up h-fit`} style={delay(560)}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold text-ink">Today's queue</h2>
                        <Link
                            to="/appointments"
                            className="group flex items-center gap-1 text-sm font-medium text-lavender-deep hover:underline"
                        >
                            View all <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                        </Link>
                    </div>

                    <div className="mb-5">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-ink-secondary">
                            <span>
                                {completed} of {active.length} done
                            </span>
                            <span className="font-semibold text-lavender-deep tabular-nums">{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-lavender-light">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-ai-start to-primary transition-all duration-700 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {queue.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-xl bg-section py-10 text-center">
                            <CheckCircle2 size={30} className="animate-float text-success" />
                            <p className="text-sm text-ink-secondary">
                                {active.length === 0 ? "No appointments today." : "All caught up. Nothing left in the queue."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Next up */}
                            <div className="animate-fade-up rounded-xl border border-lavender-medium bg-gradient-to-br from-lavender-light to-card p-4 transition hover:shadow-card">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-lavender-deep">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                                        </span>
                                        Next up
                                    </span>
                                    <StatusBadge status={next.status} />
                                </div>
                                <p className="mt-2 text-lg font-semibold text-lavender-deep">{formatTime(next.timeSlot)}</p>
                                <p className="truncate text-sm font-medium text-ink">{next.patient?.user?.name || "—"}</p>
                                {next.reason && <p className="mt-0.5 truncate text-xs text-ink-secondary">{next.reason}</p>}
                                <Link
                                    to={`/prescriptions/new?patient=${next.patient?._id}&appointment=${next._id}`}
                                    className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary shadow-md shadow-primary/30 transition hover:bg-primary-hover active:scale-[0.98] active:bg-primary-active ${focusRing}`}
                                >
                                    <FilePlus2 size={14} /> Start consultation
                                </Link>
                            </div>

                            {/* Rest of the queue */}
                            {rest.length > 0 && (
                                <div className="mt-4">
                                    {rest.length >= 3 && (
                                        <div className="mb-2 flex items-center gap-2 rounded-lg border border-input-line bg-card px-3 transition focus-within:border-focus focus-within:ring-4 focus-within:ring-primary/15">
                                            <Search size={14} className="text-placeholder" />
                                            <input
                                                value={q}
                                                onChange={(e) => setQ(e.target.value)}
                                                placeholder="Search patient..."
                                                className="w-full bg-transparent py-2 text-xs text-ink outline-none placeholder:text-placeholder"
                                            />
                                        </div>
                                    )}

                                    {filteredRest.length === 0 ? (
                                        <p className="py-4 text-center text-xs text-ink-muted">No patients match your search.</p>
                                    ) : (
                                        <ul className="space-y-1">
                                            {filteredRest.map((a, i) => (
                                                <li key={a._id} className="animate-fade-up" style={delay(80 + i * 70)}>
                                                    <Link
                                                        to={`/prescriptions/new?patient=${a.patient?._id}&appointment=${a._id}`}
                                                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-lavender-soft ${focusRing}`}
                                                    >
                                                        <span className="w-16 shrink-0 text-xs font-semibold text-lavender-deep">
                                                            {formatTime(a.timeSlot)}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate text-sm font-medium text-ink">
                                                                {a.patient?.user?.name || "—"}
                                                            </span>
                                                            {a.reason && (
                                                                <span className="block truncate text-xs text-ink-muted">{a.reason}</span>
                                                            )}
                                                        </span>
                                                        <ArrowRight
                                                            size={14}
                                                            className="shrink-0 text-placeholder transition group-hover:translate-x-0.5 group-hover:text-lavender-deep"
                                                        />
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}