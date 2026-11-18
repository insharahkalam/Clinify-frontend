import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, CalendarDays, ClipboardList, Stethoscope, Users, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { errMsg, formatDay, formatMonth, pkr, planLimit, planUsed, todayStr } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import Stat from "../../components/Stat";
import UsageBar from "../../components/UsageBar";
import StatusBadge from "../../components/StatusBadge";

const card = "min-w-0 rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]";
const tick = { fill: "#454052", fontSize: 12, opacity: 0.7 };
const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [usage, setUsage] = useState(null);

    useEffect(() => {
        api
            .get(ENDPOINTS.analytics.admin)
            .then(({ data }) => setStats(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setStats(false);
            });
        api
            .get(ENDPOINTS.subscription.usage)
            .then(({ data }) => setUsage(data))
            .catch(() => setUsage(false));
    }, []);

    if (stats === null) return <Loader />;
    if (stats === false) {
        return <EmptyState icon={CalendarDays} title="Dashboard load nahi hua" text="Backend chal raha hai ya nahi check karein." />;
    }

    const chart = (stats.monthlyAppointments || []).map((m) => ({ label: formatMonth(m.month), count: m.count }));
    const diag = stats.mostCommonDiagnosis || [];
    const maxDiag = Math.max(1, ...diag.map((d) => d.count));
    const total = stats.totalAppointments || 0;
    const byStatus = stats.appointmentsByStatus || {};
    const rev = stats.revenue || {};

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader title={`Hello, ${user.name} 👋`} subtitle={formatDay(todayStr())} />

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Patients" value={stats.totalPatients} icon={ClipboardList} />
                <Stat label="Doctors" value={stats.totalDoctors} icon={Stethoscope} />
                <Stat label="Receptionists" value={stats.totalReceptionists} icon={Users} />
                <Stat label="Is mahine ki appointments" value={stats.thisMonthAppointments} icon={CalendarDays} hint={`Kul: ${total}`} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className={`${card} lg:col-span-2`}>
                    <h2 className="mb-4 font-semibold">Pichle mahino ki appointments</h2>
                    {chart.length === 0 ? (
                        <p className="rounded-xl bg-page py-16 text-center text-sm text-ink/60">Abhi data nahi hai.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="#EAE5F3" />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
                                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={tick} />
                                <Tooltip
                                    cursor={{ fill: "#F7F5FC" }}
                                    contentStyle={{ borderRadius: 12, border: "1px solid #EAE5F3", boxShadow: "0 8px 24px rgba(169,155,203,0.18)" }}
                                    formatter={(v) => [v, "Appointments"]}
                                />
                                <Bar dataKey="count" fill="#A99BCB" radius={[8, 8, 0, 0]} maxBarSize={44} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className={`${card} h-fit`}>
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="font-semibold">Plan</h2>
                        {usage && (
                            <span className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold capitalize text-primary-dark">
                                {usage.plan}
                            </span>
                        )}
                    </div>
                    {usage ? (
                        <UsageBar used={planUsed(usage.patientLimit)} limit={planLimit(usage.patientLimit)} />
                    ) : (
                        <p className="text-sm text-ink/60">Plan ki maloomat nahi mil saki.</p>
                    )}
                    <Link to="/plans" className="mt-5 flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline">
                        Plan aur billing <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className={card}>
                    <h2 className="mb-4 font-semibold">Appointments ki halat</h2>
                    <ul className="space-y-4">
                        {STATUSES.map((s) => {
                            const n = byStatus[s] || 0;
                            return (
                                <li key={s}>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <StatusBadge status={s} />
                                        <span className="text-sm font-semibold">{n}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-page">
                                        <div className="h-full rounded-full bg-primary" style={{ width: total ? `${(n / total) * 100}%` : 0 }} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className={card}>
                    <h2 className="mb-4 font-semibold">Aam bimariyan</h2>
                    {diag.length === 0 ? (
                        <p className="rounded-xl bg-page py-10 text-center text-sm text-ink/60">Abhi koi diagnosis nahi.</p>
                    ) : (
                        <ul className="space-y-4">
                            {diag.map((d) => (
                                <li key={d.name}>
                                    <div className="mb-1.5 flex items-center justify-between text-sm">
                                        <span className="truncate capitalize">{d.name}</span>
                                        <span className="ml-3 font-semibold">{d.count}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-page">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${(d.count / maxDiag) * 100}%` }} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={`${card} h-fit`}>
                    <div className="mb-4 flex items-center gap-2.5">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/60 text-primary-dark">
                            <Wallet size={18} />
                        </div>
                        <h2 className="font-semibold">Revenue</h2>
                    </div>
                    <p className="text-sm text-ink/60">Is mahine</p>
                    <p className="text-2xl font-bold">{pkr(rev.thisMonth)}</p>
                    <p className="mt-4 text-sm text-ink/60">Kul</p>
                    <p className="text-xl font-semibold">{pkr(rev.total)}</p>
                    {rev.simulated && (
                        <p className="mt-4 text-xs text-ink/50">
                            Andaza: har completed appointment ki fees {pkr(rev.feePerAppointment)}.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}