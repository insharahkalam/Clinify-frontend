import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarDays, Clock, CheckCheck, Users, Plus, UserPlus, ArrowRight } from "lucide-react";
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

export default function ReceptionistDashboard() {
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
            .get(ENDPOINTS.receptionist.patients)
            .then(({ data }) => setPatientCount((Array.isArray(data) ? data : data.patients || []).length))
            .catch(() => { });
    }, [today]);

    if (!appts) return <Loader />;

    const active = appts.filter((a) => a.status !== "cancelled");
    const pending = active.filter((a) => a.status === "pending").length;
    const completed = active.filter((a) => a.status === "completed").length;

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader title={`Hello, ${user.name} 👋`} subtitle={formatDay(today)} />

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Today's appointments" value={active.length} icon={CalendarDays} />
                <Stat label="Pending" value={pending} icon={Clock} />
                <Stat label="Completed" value={completed} icon={CheckCheck} />
                <Stat label="Total patients" value={patientCount} icon={Users} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
                {/* Today's list */}
                <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)] lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold">Aaj ki appointments</h2>
                        <Link to="/appointments" className="flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline">
                            Sab dekhein <ArrowRight size={14} />
                        </Link>
                    </div>

                    {active.length === 0 ? (
                        <p className="rounded-xl bg-page py-10 text-center text-sm text-ink/60">Aaj koi appointment nahi hai.</p>
                    ) : (
                        <ul className="divide-y divide-line">
                            {active.slice(0, 8).map((a) => (
                                <li key={a._id} className="flex items-center gap-4 py-3.5">
                                    <span className="w-20 shrink-0 text-sm font-semibold text-primary-dark">{formatTime(a.timeSlot)}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{a.patient?.user?.name || "—"}</p>
                                        <p className="truncate text-xs text-ink/60">Dr. {a.doctor?.name}</p>
                                    </div>
                                    <StatusBadge status={a.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Quick actions */}
                <div className="h-fit rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                    <h2 className="mb-4 font-semibold">Quick actions</h2>
                    <div className="space-y-3">
                        <Link
                            to="/appointments/new"
                            className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark"
                        >
                            <Plus size={18} /> Book appointment
                        </Link>
                        <Link
                            to="/patients/new"
                            className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink/80 transition hover:bg-page"
                        >
                            <UserPlus size={18} className="text-primary" /> Register patient
                        </Link>
                        <Link
                            to="/patients"
                            className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink/80 transition hover:bg-page"
                        >
                            <Users size={18} className="text-primary" /> Patient list
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}