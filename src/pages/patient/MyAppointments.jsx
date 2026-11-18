import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, CalendarDays, Clock, Loader2, Plus, Search, Sparkles, X } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatShortDay, formatTime, todayStr } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";

/* Status colors from the MediSync theme: Pending = warning, Confirmed = success,
   Completed = info, Cancelled = danger. */
const STATUS = {
    pending: { label: "Pending", pill: "bg-warning-bg text-warning", dot: "bg-warning", bar: "bg-warning" },
    confirmed: { label: "Confirmed", pill: "bg-success-bg text-success", dot: "bg-success", bar: "bg-success" },
    completed: { label: "Completed", pill: "bg-info-bg text-info", dot: "bg-info", bar: "bg-info" },
    cancelled: { label: "Cancelled", pill: "bg-danger-bg text-danger", dot: "bg-danger", bar: "bg-danger" },
};
const FALLBACK = { label: "", pill: "bg-section text-ink-secondary", dot: "bg-ink-muted", bar: "bg-lavender-medium" };

function StatusPill({ status }) {
    const s = STATUS[status] || FALLBACK;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${s.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${status === "pending" ? "animate-pulse" : ""}`} />
            {s.label || status}
        </span>
    );
}

const toDate = (ymd) => new Date(`${ymd}T00:00:00`);
const dayDiff = (ymd) => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return Math.round((toDate(ymd) - t) / 86400000);
};
const relLabel = (ymd) => {
    const n = dayDiff(ymd);
    if (n === 0) return "Aaj";
    if (n === 1) return "Kal";
    if (n > 1) return `${n} din baad`;
    if (n === -1) return "Kal thi";
    return `${-n} din pehle`;
};
const dateParts = (ymd) => {
    const d = toDate(ymd);
    return {
        day: d.getDate(),
        month: d.toLocaleDateString("en-GB", { month: "short" }),
        weekday: d.toLocaleDateString("en-GB", { weekday: "short" }),
    };
};

export default function MyAppointments() {
    const [items, setItems] = useState(null);
    const [tab, setTab] = useState("upcoming");
    const [query, setQuery] = useState("");
    const [target, setTarget] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(
        () =>
            api
                .get(ENDPOINTS.appointments.my)
                .then(({ data }) => setItems(data))
                .catch((e) => {
                    toast.error(errMsg(e));
                    setItems([]);
                }),
        []
    );

    useEffect(() => {
        load();
    }, [load]);

    if (!items) return <Loader />;

    const today = todayStr();
    const isUpcoming = (a) => a.date >= today && ["pending", "confirmed"].includes(a.status);

    const upcoming = items
        .filter(isUpcoming)
        .sort((a, b) => (a.date + a.timeSlot).localeCompare(b.date + b.timeSlot));
    const past = items
        .filter((a) => !isUpcoming(a))
        .sort((a, b) => (b.date + b.timeSlot).localeCompare(a.date + a.timeSlot));
    const next = upcoming[0];

    const q = query.trim().toLowerCase();
    const visible = (tab === "upcoming" ? upcoming : past).filter(
        (a) => !q || `${a.doctor?.name || ""} ${a.reason || ""}`.toLowerCase().includes(q)
    );

    const confirmCancel = async () => {
        setBusy(true);
        try {
            await api.put(ENDPOINTS.appointments.cancel(target._id));
            toast.success("Appointment cancel ho gayi");
            setTarget(null);
            await load();
        } catch (e) {
            toast.error(errMsg(e));
        } finally {
            setBusy(false);
        }
    };

    const tabs = [
        ["upcoming", "Upcoming", upcoming.length],
        ["past", "Past", past.length],
    ];

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader
                title="My Appointments"
                subtitle="Aapki saari appointments yahan hain"
                action={
                    <Link
                        to="/appointments/new"
                        className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-md shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-hover active:translate-y-0 active:bg-primary-active"
                    >
                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-card/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        <Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" />
                        Book appointment
                    </Link>
                }
            />

            {/* Next appointment highlight */}
            {next && (
                <div className="animate-fade-up mb-6 overflow-hidden rounded-2xl bg-ai-gradient p-5 text-on-primary shadow-card transition-shadow duration-300 hover:shadow-hover">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-card/25">
                            <Sparkles size={22} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
                                Agli appointment · {relLabel(next.date)}
                            </p>
                            <p className="truncate text-lg font-semibold">Dr. {next.doctor?.name || "—"}</p>
                            <p className="text-sm opacity-90">
                                {formatShortDay(next.date)} · {formatTime(next.timeSlot)}
                            </p>
                        </div>
                        <StatusPill status={next.status} />
                    </div>
                </div>
            )}

            {/* Tabs + search */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative grid grid-cols-2 rounded-full border border-line bg-card p-1 shadow-card">
                    <span
                        aria-hidden
                        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-primary shadow-md shadow-primary/30 transition-transform duration-300 ease-out ${tab === "past" ? "translate-x-full" : ""
                            }`}
                    />
                    {tabs.map(([key, label, count]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-5 py-1.5 text-sm font-medium transition-colors duration-300 ${tab === key ? "text-on-primary" : "text-ink-secondary hover:text-primary"
                                }`}
                        >
                            {label}
                            <span
                                className={`rounded-full px-1.5 text-xs transition-colors duration-300 ${tab === key ? "bg-card/25" : "bg-lavender-light text-primary"
                                    }`}
                            >
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative sm:w-64">
                    <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-placeholder" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Doctor ya wajah search karein"
                        className="w-full rounded-full border border-line-input bg-card py-2 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-placeholder hover:border-lavender-medium focus:border-focus focus:ring-4 focus:ring-secondary/60"
                    />
                </div>
            </div>

            {visible.length === 0 ? (
                q ? (
                    <div className="rounded-2xl border border-dashed border-line-input bg-section px-4 py-10 text-center text-sm text-ink-muted">
                        "{query}" se koi appointment match nahi hui
                    </div>
                ) : (
                    <EmptyState
                        icon={CalendarDays}
                        title={tab === "upcoming" ? "Koi upcoming appointment nahi" : "Koi purani appointment nahi"}
                        text={tab === "upcoming" ? "Naya time book karne ke liye upar button dabayein." : undefined}
                    />
                )
            ) : (
                <div key={tab} className="space-y-3">
                    {visible.map((a, i) => {
                        const canCancel = ["pending", "confirmed"].includes(a.status);
                        const s = STATUS[a.status] || FALLBACK;
                        const d = dateParts(a.date);
                        return (
                            <div
                                key={a._id}
                                style={{ animationDelay: `${i * 60}ms` }}
                                className="group relative animate-fade-up overflow-hidden rounded-2xl border border-line bg-card p-4 pl-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-lavender-medium hover:shadow-hover sm:p-5 sm:pl-6"
                            >
                                <span className={`absolute inset-y-0 left-0 w-1 ${s.bar} transition-all duration-300 group-hover:w-1.5`} />

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="grid h-16 w-16 shrink-0 place-content-center rounded-xl bg-lavender-light text-center transition-colors duration-300 group-hover:bg-secondary">
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">{d.weekday}</span>
                                        <span className="text-xl font-bold leading-none text-primary-hover">{d.day}</span>
                                        <span className="text-[10px] font-medium text-ink-secondary">{d.month}</span>
                                    </div>

                                    <div className="min-w-0 flex-1 basis-44">
                                        <p className="truncate font-semibold text-ink">Dr. {a.doctor?.name || "—"}</p>
                                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-secondary">
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={14} className="text-primary" /> {formatTime(a.timeSlot)}
                                            </span>
                                            {tab === "upcoming" && (
                                                <span className="rounded-full bg-section px-2 py-0.5 text-xs font-medium text-primary">
                                                    {relLabel(a.date)}
                                                </span>
                                            )}
                                        </p>
                                        {a.reason && <p className="mt-1 truncate text-xs text-ink-muted">{a.reason}</p>}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <StatusPill status={a.status} />
                                        {canCancel && (
                                            <button
                                                type="button"
                                                onClick={() => setTarget(a)}
                                                className="flex items-center gap-1.5 rounded-lg border border-danger/30 bg-card px-3 py-1.5 text-xs font-medium text-danger transition-all duration-200 hover:border-danger hover:bg-danger-bg active:scale-95"
                                            >
                                                <X size={14} /> Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {target && (
                <Modal title="Appointment cancel karein?" onClose={() => !busy && setTarget(null)}>
                    <div className="flex gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-danger-bg text-danger">
                            <AlertTriangle size={20} />
                        </span>
                        <p className="text-sm text-ink-secondary">
                            Dr. {target.doctor?.name} ke saath {formatShortDay(target.date)} ko {formatTime(target.timeSlot)} wali
                            appointment cancel ho jayegi.
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setTarget(null)}
                            disabled={busy}
                            className="rounded-xl border border-line bg-card px-5 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:border-lavender-medium hover:bg-section hover:text-primary disabled:opacity-60"
                        >
                            Wapis
                        </button>
                        <button
                            type="button"
                            onClick={confirmCancel}
                            disabled={busy}
                            className="flex items-center gap-2 rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-on-primary shadow-md shadow-danger/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
                        >
                            {busy && <Loader2 size={16} className="animate-spin" />}
                            Haan, cancel karein
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}