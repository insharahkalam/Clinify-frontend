import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
    CalendarDays,
    Check,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    FilePlus2,
    Loader2,
    Phone,
    Search,
    UserRound,
    X,
} from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatDay, formatTime, formatWeekday, shiftDate, todayStr } from "../../utils/format";
import StatusBadge from "../../components/StatusBadge";

/* ------------------------------------------------------------------ */
/*  Theme helpers (MediSync tokens)                                    */
/* ------------------------------------------------------------------ */
const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];

const focusRing = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25";
const delay = (ms) => ({ animationDelay: `${ms}ms` });

// accent per status: left bar, filter dot
const STATUS_TONE = {
    pending: { bar: "bg-warning", dot: "bg-warning" },
    confirmed: { bar: "bg-info", dot: "bg-info" },
    completed: { bar: "bg-success", dot: "bg-success" },
    cancelled: { bar: "bg-danger", dot: "bg-danger" },
    all: { bar: "bg-primary", dot: "bg-primary" },
};

// action button variants
const ACTION = {
    base: `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`,
    primary: "bg-primary text-on-primary shadow-md shadow-primary/25 hover:bg-primary-hover active:bg-primary-active",
    success: "bg-success-bg text-success hover:bg-success hover:text-white",
    info: "bg-info-bg text-info hover:bg-info hover:text-white",
    ghost: "border border-input-line bg-card text-ink-secondary hover:bg-lavender-soft hover:text-lavender-deep",
};

const dayNumber = (d) => new Date(`${d}T00:00:00`).getDate();

function initials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Small components                                                   */
/* ------------------------------------------------------------------ */
function RowSkeleton() {
    return (
        <div className="flex items-center gap-4 px-5 py-4">
            <div className="h-4 w-16 animate-pulse rounded bg-lavender-light/80" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-lavender-light/80" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 animate-pulse rounded bg-lavender-light/80" />
                <div className="h-3 w-28 animate-pulse rounded bg-lavender-light/60" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded-full bg-lavender-light/80" />
        </div>
    );
}

function EmptyBlock({ filtered }) {
    return (
        <div className="animate-fade-up flex flex-col items-center gap-3 rounded-2xl border border-dashed border-lavender-medium bg-section px-6 py-16 text-center">
            <div className="animate-float flex h-16 w-16 items-center justify-center rounded-2xl bg-lavender-light text-lavender-deep">
                <CalendarDays size={28} />
            </div>
            <h3 className="font-semibold text-ink">No appointments found</h3>
            <p className="max-w-xs text-sm text-ink-secondary">
                {filtered
                    ? "Nothing matches your current filter or search. Try changing them."
                    : "There are no appointments scheduled for this day."}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function DoctorAppointments() {
    const [params, setParams] = useSearchParams();
    const date = params.get("date") || todayStr();
    const today = todayStr();
    const setDate = (d) => d && setParams({ date: d }, { replace: true });

    const [status, setStatus] = useState("all");
    const [q, setQ] = useState("");
    const [items, setItems] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(
        () =>
            api
                .get(ENDPOINTS.appointments.schedule, { params: { date } })
                .then(({ data }) => setItems(data))
                .catch((e) => {
                    toast.error(errMsg(e));
                    setItems([]);
                }),
        [date]
    );

    useEffect(() => {
        setItems(null);
        load();
    }, [load]);

    const changeStatus = async (id, next) => {
        setBusyId(id);
        try {
            await api.put(ENDPOINTS.appointments.status(id), { status: next });
            toast.success("Status updated");
            await load();
        } catch (e) {
            toast.error(errMsg(e));
        } finally {
            setBusyId(null);
        }
    };

    const counts = useMemo(
        () => (items || []).reduce((acc, a) => ({ ...acc, [a.status]: (acc[a.status] || 0) + 1 }), {}),
        [items]
    );

    const visible = useMemo(() => {
        const term = q.trim().toLowerCase();
        return (items || []).filter((a) => {
            if (status !== "all" && a.status !== status) return false;
            if (!term) return true;
            const name = (a.patient?.user?.name || "").toLowerCase();
            const phone = (a.patient?.user?.phone || "").toLowerCase();
            return name.includes(term) || phone.includes(term);
        });
    }, [items, status, q]);

    // 7-day strip centered on the selected date
    const week = useMemo(() => [-3, -2, -1, 0, 1, 2, 3].map((n) => shiftDate(date, n)), [date]);

    return (
        <div className="mx-auto max-w-6xl">
            {/* ---------- Header ---------- */}
            <div className="animate-fade-up mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-ink">Appointments</h1>
                    <p className="mt-1 text-sm text-ink-secondary">{formatDay(date)}</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl border border-line bg-card p-1 shadow-card">
                        <button
                            onClick={() => setDate(shiftDate(date, -1))}
                            className={`rounded-lg p-2 text-ink-secondary transition hover:bg-lavender-soft hover:text-lavender-deep ${focusRing}`}
                            aria-label="Previous day"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent px-2 text-sm font-medium text-ink outline-none"
                        />
                        <button
                            onClick={() => setDate(shiftDate(date, 1))}
                            className={`rounded-lg p-2 text-ink-secondary transition hover:bg-lavender-soft hover:text-lavender-deep ${focusRing}`}
                            aria-label="Next day"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {date !== today && (
                        <button
                            onClick={() => setDate(today)}
                            className={`animate-fade-up rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-md shadow-primary/25 transition hover:bg-primary-hover active:scale-[0.97] ${focusRing}`}
                        >
                            Today
                        </button>
                    )}
                </div>
            </div>

            {/* ---------- Week strip ---------- */}
            <div className="animate-fade-up mb-5 grid grid-cols-7 gap-2" style={delay(60)}>
                {week.map((d) => {
                    const selected = d === date;
                    const isToday = d === today;
                    return (
                        <button
                            key={d}
                            onClick={() => setDate(d)}
                            className={`group flex flex-col items-center gap-0.5 rounded-2xl border px-1 py-3 transition duration-200 ${focusRing} ${selected
                                ? "border-primary bg-primary text-on-primary shadow-md shadow-primary/30"
                                : "border-line-light bg-card text-ink-secondary shadow-card hover:-translate-y-0.5 hover:border-lavender-medium hover:shadow-hover"
                                }`}
                        >
                            <span className={`text-[11px] font-medium uppercase tracking-wide ${selected ? "text-white/80" : "text-ink-muted"}`}>
                                {formatWeekday(d)}
                            </span>
                            <span className={`text-lg font-bold tabular-nums ${selected ? "" : "text-ink"}`}>{dayNumber(d)}</span>
                            <span
                                className={`h-1 w-1 rounded-full ${isToday ? (selected ? "bg-white" : "bg-primary") : "bg-transparent"
                                    }`}
                            />
                        </button>
                    );
                })}
            </div>

            {/* ---------- Filters + search ---------- */}
            <div className="animate-fade-up mb-5 flex flex-wrap items-center justify-between gap-3" style={delay(120)}>
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((f) => {
                        const count = f === "all" ? (items || []).length : counts[f] || 0;
                        const active = status === f;
                        return (
                            <button
                                key={f}
                                onClick={() => setStatus(f)}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium capitalize transition active:scale-[0.97] ${focusRing} ${active
                                    ? "bg-primary text-on-primary shadow-md shadow-primary/30"
                                    : "border border-line bg-card text-ink-secondary hover:border-lavender-medium hover:bg-lavender-soft"
                                    }`}
                            >
                                {!active && <span className={`h-1.5 w-1.5 rounded-full ${STATUS_TONE[f].dot}`} />}
                                {f}
                                <span
                                    className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-white/25" : "bg-lavender-light text-lavender-deep"
                                        }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex w-full items-center gap-2 rounded-xl border border-input-line bg-card px-3 transition focus-within:border-focus focus-within:ring-4 focus-within:ring-primary/15 sm:w-64">
                    <Search size={15} className="shrink-0 text-placeholder" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search name or phone..."
                        className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-placeholder"
                    />
                    {q && (
                        <button
                            onClick={() => setQ("")}
                            aria-label="Clear search"
                            className="rounded-md p-1 text-ink-muted transition hover:bg-lavender-soft hover:text-ink"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* ---------- List ---------- */}
            {!items ? (
                <div className="overflow-hidden rounded-2xl border border-line-light bg-card shadow-card">
                    <div className="divide-y divide-line-light">
                        {[0, 1, 2, 3].map((i) => (
                            <RowSkeleton key={i} />
                        ))}
                    </div>
                </div>
            ) : visible.length === 0 ? (
                <EmptyBlock filtered={items.length > 0} />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-line-light bg-card shadow-card">
                    <ul key={`${date}-${status}-${q}`} className="divide-y divide-line-light">
                        {visible.map((a, i) => {
                            const busy = busyId === a._id;
                            const open = a.status === "pending" || a.status === "confirmed";
                            const name = a.patient?.user?.name || "—";
                            const tone = STATUS_TONE[a.status] || STATUS_TONE.all;

                            return (
                                <li
                                    key={a._id}
                                    style={delay(Math.min(i, 10) * 55)}
                                    className={`animate-fade-up group relative flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 transition hover:bg-lavender-soft/60 ${busy ? "opacity-70" : ""
                                        }`}
                                >
                                    {/* status accent bar */}
                                    <span
                                        className={`absolute left-0 top-3 bottom-3 w-1 origin-center scale-y-50 rounded-r-full opacity-0 transition duration-200 group-hover:scale-y-100 group-hover:opacity-100 ${tone.bar}`}
                                    />

                                    <p className="w-20 shrink-0 text-sm font-semibold text-lavender-deep tabular-nums">
                                        {formatTime(a.timeSlot)}
                                    </p>

                                    <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender-light text-sm font-bold text-lavender-deep transition group-hover:scale-105">
                                            {initials(name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-ink">{name}</p>
                                            <p className="flex items-center gap-1 truncate text-xs text-ink-secondary">
                                                <Phone size={11} className="shrink-0" />
                                                {a.patient?.user?.phone || "No phone"}
                                            </p>
                                            {a.reason && <p className="mt-0.5 truncate text-xs text-ink-muted">{a.reason}</p>}
                                        </div>
                                    </div>

                                    <StatusBadge status={a.status} />

                                    {a.status !== "cancelled" && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {busy && <Loader2 size={16} className="animate-spin text-primary" />}

                                            {a.status === "pending" && (
                                                <button
                                                    className={`${ACTION.base} ${ACTION.success}`}
                                                    disabled={busy}
                                                    onClick={() => changeStatus(a._id, "confirmed")}
                                                >
                                                    <Check size={14} /> Confirm
                                                </button>
                                            )}

                                            {open && (
                                                <Link
                                                    to={`/prescriptions/new?patient=${a.patient?._id}&appointment=${a._id}`}
                                                    className={`${ACTION.base} ${ACTION.primary}`}
                                                >
                                                    <FilePlus2 size={14} /> Consult
                                                </Link>
                                            )}

                                            {a.status === "confirmed" && (
                                                <button
                                                    className={`${ACTION.base} ${ACTION.info}`}
                                                    disabled={busy}
                                                    onClick={() => changeStatus(a._id, "completed")}
                                                >
                                                    <CheckCheck size={14} /> Complete
                                                </button>
                                            )}

                                            <Link to={`/patients/${a.patient?._id}`} className={`${ACTION.base} ${ACTION.ghost}`}>
                                                <UserRound size={14} /> Patient
                                            </Link>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}