import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Activity, CalendarDays, FilePlus2, FileText, Sparkles, Users, ArrowRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { errMsg, formatDay, formatTime, formatWeekday, todayStr } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import Stat from "../../components/Stat";
import StatusBadge from "../../components/StatusBadge";

const card = "min-w-0 rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]";
const tick = { fill: "#454052", fontSize: 12, opacity: 0.7 };

export default function DoctorDashboard() {
    const { user } = useAuth();
    const today = todayStr();
    const [appts, setAppts] = useState(null);
    const [stats, setStats] = useState(null); // null = load ho raha, false = fail

    useEffect(() => {
        api
            .get(ENDPOINTS.appointments.schedule, { params: { date: today } })
            .then(({ data }) => setAppts(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setAppts([]);
            });
        api
            .get(ENDPOINTS.analytics.doctor)
            .then(({ data }) => setStats(data))
            .catch(() => setStats(false));
    }, [today]);

    if (!appts || stats === null) return <Loader />;

    const active = appts.filter((a) => a.status !== "cancelled");
    const queue = active.filter((a) => a.status !== "completed");
    const chart = stats ? stats.last7Days.map((d) => ({ label: formatWeekday(d.date), count: d.count })) : [];

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title={`Dr. ${user.name}`}
                subtitle={formatDay(today)}
                action={
                    <Link
                        to="/symptom-checker"
                        className="flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-medium text-primary-dark transition hover:bg-page"
                    >
                        <Sparkles size={16} /> AI symptom checker
                    </Link>
                }
            />

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Aaj ki appointments" value={stats ? stats.todayAppointments : active.length} icon={CalendarDays} />
                <Stat
                    label="Is mahine"
                    value={stats ? stats.thisMonth.total : "—"}
                    icon={Activity}
                    hint={stats ? `${stats.thisMonth.completed} complete • ${stats.thisMonth.cancelled} cancel` : undefined}
                />
                <Stat label="Patients ka ilaaj hua" value={stats ? stats.patientsTreated : "—"} icon={Users} />
                <Stat
                    label="Prescriptions (is mahine)"
                    value={stats ? stats.prescriptions.thisMonth : "—"}
                    icon={FileText}
                    hint={stats ? `Kul: ${stats.prescriptions.total}` : undefined}
                />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className={`${card} lg:col-span-2`}>
                    <h2 className="mb-4 font-semibold">Pichle 7 din ki appointments</h2>
                    {!stats ? (
                        <p className="rounded-xl bg-page py-16 text-center text-sm text-ink/60">Chart load nahi ho saka.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="#EAE5F3" />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
                                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={tick} />
                                <Tooltip
                                    cursor={{ fill: "#F7F5FC" }}
                                    contentStyle={{ borderRadius: 12, border: "1px solid #EAE5F3", boxShadow: "0 8px 24px rgba(169,155,203,0.18)" }}
                                    formatter={(v) => [v, "Appointments"]}
                                />
                                <Bar dataKey="count" fill="#A99BCB" radius={[8, 8, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className={`${card} h-fit`}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold">Aaj ki queue</h2>
                        <Link to="/appointments" className="flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline">
                            Sab <ArrowRight size={14} />
                        </Link>
                    </div>

                    {queue.length === 0 ? (
                        <p className="rounded-xl bg-page py-10 text-center text-sm text-ink/60">Aaj koi appointment baaqi nahi.</p>
                    ) : (
                        <ul className="divide-y divide-line">
                            {queue.map((a) => (
                                <li key={a._id} className="py-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-primary-dark">{formatTime(a.timeSlot)}</span>
                                        <StatusBadge status={a.status} />
                                    </div>
                                    <p className="mt-1 truncate text-sm font-medium">{a.patient?.user?.name || "—"}</p>
                                    {a.reason && <p className="truncate text-xs text-ink/60">{a.reason}</p>}
                                    <Link
                                        to={`/prescriptions/new?patient=${a.patient?._id}&appointment=${a._id}`}
                                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark"
                                    >
                                        <FilePlus2 size={14} /> Consult
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}