import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, FilePlus2, Loader2, UserRound } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatDay, formatTime, shiftDate, todayStr } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";

const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];
const btn = "flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink/70 transition hover:bg-page disabled:opacity-50";

export default function DoctorAppointments() {
    const [params, setParams] = useSearchParams();
    const date = params.get("date") || todayStr();
    const setDate = (d) => d && setParams({ date: d }, { replace: true });

    const [status, setStatus] = useState("all");
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
            toast.success("Status update ho gaya");
            await load();
        } catch (e) {
            toast.error(errMsg(e));
        } finally {
            setBusyId(null);
        }
    };

    const counts = (items || []).reduce((acc, a) => ({ ...acc, [a.status]: (acc[a.status] || 0) + 1 }), {});
    const visible = (items || []).filter((a) => status === "all" || a.status === status);

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader title="Appointments" subtitle={formatDay(date)} />

            <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
                    <button onClick={() => setDate(shiftDate(date, -1))} className="rounded-lg p-2 text-ink/60 transition hover:bg-page" aria-label="Previous day">
                        <ChevronLeft size={18} />
                    </button>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent px-2 text-sm font-medium outline-none" />
                    <button onClick={() => setDate(shiftDate(date, 1))} className="rounded-lg p-2 text-ink/60 transition hover:bg-page" aria-label="Next day">
                        <ChevronRight size={18} />
                    </button>
                </div>
                {date !== todayStr() && (
                    <button onClick={() => setDate(todayStr())} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-primary-dark transition hover:bg-page">
                        Aaj
                    </button>
                )}
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setStatus(f)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${status === f ? "bg-primary text-white shadow-md shadow-primary/30" : "border border-line bg-white text-ink/70 hover:bg-page"
                            }`}
                    >
                        {f} <span className="opacity-70">({f === "all" ? (items || []).length : counts[f] || 0})</span>
                    </button>
                ))}
            </div>

            {!items ? (
                <Loader />
            ) : visible.length === 0 ? (
                <EmptyState icon={CalendarDays} title="Koi appointment nahi" text="Is din ya filter ke liye koi appointment nahi mili." />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                    <ul className="divide-y divide-line">
                        {visible.map((a) => {
                            const busy = busyId === a._id;
                            const open = a.status === "pending" || a.status === "confirmed";
                            return (
                                <li key={a._id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
                                    <p className="w-24 shrink-0 text-sm font-semibold text-primary-dark">{formatTime(a.timeSlot)}</p>

                                    <div className="min-w-0 flex-1 basis-48">
                                        <p className="truncate text-sm font-medium">{a.patient?.user?.name || "—"}</p>
                                        <p className="truncate text-xs text-ink/60">{a.patient?.user?.phone || "No phone"}</p>
                                        {a.reason && <p className="mt-0.5 truncate text-xs text-ink/50">{a.reason}</p>}
                                    </div>

                                    <StatusBadge status={a.status} />

                                    {a.status !== "cancelled" && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {busy && <Loader2 size={16} className="animate-spin text-primary" />}
                                            {a.status === "pending" && (
                                                <button className={btn} disabled={busy} onClick={() => changeStatus(a._id, "confirmed")}>
                                                    <Check size={14} /> Confirm
                                                </button>
                                            )}
                                            {open && (
                                                <Link to={`/prescriptions/new?patient=${a.patient?._id}&appointment=${a._id}`} className={btn}>
                                                    <FilePlus2 size={14} /> Consult
                                                </Link>
                                            )}
                                            {a.status === "confirmed" && (
                                                <button className={btn} disabled={busy} onClick={() => changeStatus(a._id, "completed")}>
                                                    <CheckCheck size={14} /> Complete
                                                </button>
                                            )}
                                            <Link to={`/patients/${a.patient?._id}`} className={btn}>
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