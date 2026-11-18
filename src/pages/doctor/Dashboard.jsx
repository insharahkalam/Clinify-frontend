import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarDays, Clock, CheckCheck, Users, ArrowRight, FilePlus2 } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { errMsg, formatDay, formatTime, todayStr } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";

function Stat({ label, value, icon: Icon }) {
    return (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-secondary/60 text-primary-dark">
                <Icon size={20} />
            </div>
            <p className="text-sm text-ink/60">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}

export default function DoctorDashboard() {
    const { user } = useAuth();
    const today = todayStr();
    const [appts, setAppts] = useState(null);
    const [patientCount, setPatientCount] = useState("—");

    useEffect(() => {
        api
            .get(ENDPOINTS.appointments.schedule, { params: { date: today } })
            .then(({ data }) => setAppts(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setAppts([]);
            });
        api
            .get(ENDPOINTS.doctor.patients)
            .then(({ data }) => setPatientCount(data.length))
            .catch(() => { });
    }, [today]);

    if (!appts) return <Loader />;

    const active = appts.filter((a) => a.status !== "cancelled");
    const waiting = active.filter((a) => a.status === "pending").length;
    const done = active.filter((a) => a.status === "completed").length;
    const queue = active.filter((a) => a.status !== "completed");

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader title={`Dr. ${user.name}`} subtitle={formatDay(today)} />

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Today's appointments" value={active.length} icon={CalendarDays} />
                <Stat label="Confirm hona baaqi" value={waiting} icon={Clock} />
                <Stat label="Completed" value={done} icon={CheckCheck} />
                <Stat label="My patients" value={patientCount} icon={Users} />
            </div>

            <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-semibold">Aaj ki queue</h2>
                    <Link to="/appointments" className="flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline">
                        Sab dekhein <ArrowRight size={14} />
                    </Link>
                </div>

                {queue.length === 0 ? (
                    <p className="rounded-xl bg-page py-10 text-center text-sm text-ink/60">Aaj ke liye koi appointment baaqi nahi.</p>
                ) : (
                    <ul className="divide-y divide-line">
                        {queue.map((a) => (
                            <li key={a._id} className="flex flex-wrap items-center gap-4 py-3.5">
                                <span className="w-20 shrink-0 text-sm font-semibold text-primary-dark">{formatTime(a.timeSlot)}</span>
                                <div className="min-w-0 flex-1 basis-40">
                                    <p className="truncate text-sm font-medium">{a.patient?.user?.name || "—"}</p>
                                    {a.reason && <p className="truncate text-xs text-ink/60">{a.reason}</p>}
                                </div>
                                <StatusBadge status={a.status} />
                                <Link
                                    to={`/prescriptions/new?patient=${a.patient?._id}&appointment=${a._id}`}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark"
                                >
                                    <FilePlus2 size={14} /> Consult
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}