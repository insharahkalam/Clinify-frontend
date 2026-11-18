import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarDays, Loader2, Plus, X } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatShortDay, formatTime, todayStr } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

export default function MyAppointments() {
    const [items, setItems] = useState(null);
    const [tab, setTab] = useState("upcoming");
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
    const past = items.filter((a) => !isUpcoming(a));
    const visible = tab === "upcoming" ? upcoming : past;

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

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader
                title="My Appointments"
                subtitle="Aapki saari appointments yahan hain"
                action={
                    <Link
                        to="/appointments/new"
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark"
                    >
                        <Plus size={16} /> Book appointment
                    </Link>
                }
            />

            <div className="mb-5 flex gap-2">
                {[
                    ["upcoming", `Upcoming (${upcoming.length})`],
                    ["past", `Past (${past.length})`],
                ].map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === key
                                ? "bg-primary text-white shadow-md shadow-primary/30"
                                : "border border-line bg-white text-ink/70 hover:bg-page"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {visible.length === 0 ? (
                <EmptyState
                    icon={CalendarDays}
                    title={tab === "upcoming" ? "Koi upcoming appointment nahi" : "Koi purani appointment nahi"}
                    text={tab === "upcoming" ? "Naya time book karne ke liye upar button dabayein." : undefined}
                />
            ) : (
                <div className="space-y-4">
                    {visible.map((a) => {
                        const canCancel = ["pending", "confirmed"].includes(a.status);
                        return (
                            <div
                                key={a._id}
                                className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-line bg-white p-5 shadow-[0_4px_20px_rgba(169,155,203,0.10)]"
                            >
                                <div className="w-36 shrink-0">
                                    <p className="text-sm font-semibold">{formatShortDay(a.date)}</p>
                                    <p className="text-sm text-primary-dark">{formatTime(a.timeSlot)}</p>
                                </div>

                                <div className="min-w-0 flex-1 basis-40">
                                    <p className="truncate text-sm font-medium">Dr. {a.doctor?.name || "—"}</p>
                                    {a.reason && <p className="truncate text-xs text-ink/60">{a.reason}</p>}
                                </div>

                                <StatusBadge status={a.status} />

                                {canCancel && (
                                    <button
                                        onClick={() => setTarget(a)}
                                        className="flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                    >
                                        <X size={14} /> Cancel
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {target && (
                <Modal title="Appointment cancel karein?" onClose={() => setTarget(null)}>
                    <p className="text-sm text-ink/70">
                        Dr. {target.doctor?.name} ke saath {formatShortDay(target.date)} ko {formatTime(target.timeSlot)} wali
                        appointment cancel ho jayegi.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setTarget(null)}
                            className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page"
                        >
                            Wapis
                        </button>
                        <button
                            onClick={confirmCancel}
                            disabled={busy}
                            className="flex items-center gap-2 rounded-xl bg-red-400 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
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