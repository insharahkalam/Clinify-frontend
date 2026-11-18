import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarDays, CalendarClock, Check, CheckCheck, ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatDay, formatTime, shiftDate, todayStr } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";
import RescheduleModal from "./RescheduleModal";

const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];

function ActionBtn({ icon: Icon, label, onClick, disabled, danger }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${danger
                    ? "border-red-100 text-red-500 hover:bg-red-50"
                    : "border-line text-ink/70 hover:bg-page"
                }`}
        >
            <Icon size={14} /> {label}
        </button>
    );
}

export default function Appointments() {
    const [params, setParams] = useSearchParams();
    const date = params.get("date") || todayStr();
    const setDate = (d) => d && setParams({ date: d }, { replace: true });

    const [doctors, setDoctors] = useState([]);
    const [doctorId, setDoctorId] = useState("");
    const [status, setStatus] = useState("all");
    const [items, setItems] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [resched, setResched] = useState(null);

    useEffect(() => {
        api.get(ENDPOINTS.appointments.doctors).then(({ data }) => setDoctors(data)).catch(() => { });
    }, []);

    const load = useCallback(
        () =>
            api
                .get(ENDPOINTS.appointments.schedule, { params: { date, doctorId: doctorId || undefined } })
                .then(({ data }) => setItems(data))
                .catch((e) => {
                    toast.error(errMsg(e));
                    setItems([]);
                }),
        [date, doctorId]
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

    const confirmCancel = async () => {
        const id = cancelTarget._id;
        setBusyId(id);
        try {
            await api.put(ENDPOINTS.appointments.cancel(id));
            toast.success("Appointment cancel ho gayi");
            setCancelTarget(null);
            await load();
        } catch (e) {
            toast.error(errMsg(e));
        } finally {
            setBusyId(null);
        }
    };

    const counts = (items || []).reduce((acc, a) => ({ ...acc, [a.status]: (acc[a.status] || 0) + 1 }), {});
    const visible = (items || []).filter((a) => status === "all" || a.status === status);
    const isToday = date === todayStr();

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title="Appointments"
                subtitle={formatDay(date)}
                action={
                    <Link
                        to="/appointments/new"
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark"
                    >
                        <Plus size={16} /> Book appointment
                    </Link>
                }
            />

            {/* Controls */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
                    <button onClick={() => setDate(shiftDate(date, -1))} className="rounded-lg p-2 text-ink/60 transition hover:bg-page" aria-label="Previous day">
                        <ChevronLeft size={18} />
                    </button>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent px-2 text-sm font-medium outline-none"
                    />
                    <button onClick={() => setDate(shiftDate(date, 1))} className="rounded-lg p-2 text-ink/60 transition hover:bg-page" aria-label="Next day">
                        <ChevronRight size={18} />
                    </button>
                </div>

                {!isToday && (
                    <button
                        onClick={() => setDate(todayStr())}
                        className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-primary-dark transition hover:bg-page"
                    >
                        Aaj
                    </button>
                )}

                <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-secondary/60"
                >
                    <option value="">Saare doctors</option>
                    {doctors.map((d) => (
                        <option key={d._id} value={d._id}>Dr. {d.name}</option>
                    ))}
                </select>
            </div>

            {/* Status chips */}
            <div className="mb-5 flex flex-wrap gap-2">
                {FILTERS.map((f) => {
                    const n = f === "all" ? (items || []).length : counts[f] || 0;
                    return (
                        <button
                            key={f}
                            onClick={() => setStatus(f)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${status === f
                                    ? "bg-primary text-white shadow-md shadow-primary/30"
                                    : "border border-line bg-white text-ink/70 hover:bg-page"
                                }`}
                        >
                            {f} <span className="opacity-70">({n})</span>
                        </button>
                    );
                })}
            </div>

            {/* List */}
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
                                    <div className="w-24 shrink-0">
                                        <p className="text-sm font-semibold text-primary-dark">{formatTime(a.timeSlot)}</p>
                                    </div>

                                    <div className="min-w-0 flex-1 basis-48">
                                        <p className="truncate text-sm font-medium">{a.patient?.user?.name || "—"}</p>
                                        <p className="truncate text-xs text-ink/60">
                                            {a.patient?.user?.phone || "No phone"} · Dr. {a.doctor?.name}
                                        </p>
                                        {a.reason && <p className="mt-0.5 truncate text-xs text-ink/50">{a.reason}</p>}
                                    </div>

                                    <StatusBadge status={a.status} />

                                    {open && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {busy && <Loader2 size={16} className="animate-spin text-primary" />}
                                            {a.status === "pending" && (
                                                <ActionBtn icon={Check} label="Confirm" disabled={busy} onClick={() => changeStatus(a._id, "confirmed")} />
                                            )}
                                            {a.status === "confirmed" && (
                                                <ActionBtn icon={CheckCheck} label="Complete" disabled={busy} onClick={() => changeStatus(a._id, "completed")} />
                                            )}
                                            <ActionBtn icon={CalendarClock} label="Reschedule" disabled={busy} onClick={() => setResched(a)} />
                                            <ActionBtn icon={X} label="Cancel" danger disabled={busy} onClick={() => setCancelTarget(a)} />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Cancel confirm */}
            {cancelTarget && (
                <Modal title="Appointment cancel karein?" onClose={() => setCancelTarget(null)}>
                    <p className="text-sm text-ink/70">
                        <span className="font-medium text-ink">{cancelTarget.patient?.user?.name}</span> ki{" "}
                        {formatTime(cancelTarget.timeSlot)} wali appointment cancel ho jayegi.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setCancelTarget(null)} className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page">
                            Wapis
                        </button>
                        <button
                            onClick={confirmCancel}
                            disabled={busyId === cancelTarget._id}
                            className="flex items-center gap-2 rounded-xl bg-red-400 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
                        >
                            {busyId === cancelTarget._id && <Loader2 size={16} className="animate-spin" />}
                            Haan, cancel karein
                        </button>
                    </div>
                </Modal>
            )}

            {/* Reschedule */}
            {resched && (
                <RescheduleModal
                    appointment={resched}
                    onClose={() => setResched(null)}
                    onDone={() => {
                        setResched(null);
                        load();
                    }}
                />
            )}
        </div>
    );
}