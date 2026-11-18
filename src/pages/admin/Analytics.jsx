import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Activity, CalendarDays, Gauge, Lock, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatMonth } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import Stat from "../../components/Stat";
import TrendBadge from "../../components/TrendBadge";

const card = "min-w-0 rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]";
const tick = { fill: "#454052", fontSize: 12, opacity: 0.7 };

export default function Analytics() {
    const [data, setData] = useState(null);
    const [state, setState] = useState("loading"); // loading | ok | locked | error

    useEffect(() => {
        api
            .get(ENDPOINTS.analytics.predictions)
            .then(({ data }) => {
                setData(data);
                setState("ok");
            })
            .catch((e) => {
                if (e.response?.data?.code === "FEATURE_LOCKED") return setState("locked");
                toast.error(errMsg(e));
                setState("error");
            });
    }, []);

    if (state === "loading") return <Loader />;

    if (state === "locked") {
        return (
            <div className="mx-auto max-w-3xl">
                <PageHeader title="Analytics" subtitle="Predictions aur doctor performance" />
                <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
                    <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-secondary/60 text-primary-dark">
                        <Lock size={22} />
                    </div>
                    <h3 className="font-semibold">Ye feature Pro plan mein hai</h3>
                    <p className="mt-1 text-sm text-ink/60">Advanced analytics aur predictions ke liye Pro plan chalu karein.</p>
                    <Link to="/plans" className="mt-5 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark">
                        Plan dekhein
                    </Link>
                </div>
            </div>
        );
    }

    if (state === "error") {
        return <EmptyState icon={Activity} title="Analytics load nahi hui" text="Thori der baad dobara koshish karein." />;
    }

    const f = data.patientLoadForecast;
    const hist = (f.history || []).map((h) => ({ label: formatMonth(h.month), count: h.count, predicted: null }));
    if (hist.length) hist[hist.length - 1].predicted = hist[hist.length - 1].count; // dashed line jurne ke liye
    const chart = [...hist, { label: formatMonth(f.nextMonth), count: null, predicted: f.predictedAppointments }];

    const top = data.topDiagnosesThisMonth || [];
    const maxTop = Math.max(1, ...top.map((d) => d.count));
    const common = data.mostCommonDiseaseThisMonth;

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader title="Analytics" subtitle="Predictions aur doctor performance" />

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Is mahine booked" value={f.thisMonthBooked} icon={CalendarDays} />
                <Stat label={`Andaza: ${formatMonth(f.nextMonth)}`} value={f.predictedAppointments} icon={TrendingUp} hint={`${f.basedOnMonths} mahino ke data par`} />
                <Stat label="Bharosa" value={<span className="capitalize">{f.confidence}</span>} icon={Gauge} />
                <Stat label="Sab se aam bimari" value={<span className="text-lg capitalize">{common ? common.name : "—"}</span>} icon={Activity} hint={common ? `${common.count} dafa is mahine` : "Abhi data nahi"} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className={`${card} lg:col-span-2`}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-semibold">Patient load ka andaza</h2>
                        <TrendBadge trend={f.trend} />
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={chart} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="#EAE5F3" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={tick} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: "1px solid #EAE5F3", boxShadow: "0 8px 24px rgba(169,155,203,0.18)" }}
                                formatter={(v, name) => [v, name === "count" ? "Asli" : "Andaza"]}
                            />
                            <Line type="monotone" dataKey="count" stroke="#A99BCB" strokeWidth={3} dot={{ r: 4, fill: "#A99BCB" }} connectNulls={false} />
                            <Line type="monotone" dataKey="predicted" stroke="#8F7FB8" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 4, fill: "#fff", stroke: "#8F7FB8", strokeWidth: 2 }} connectNulls={false} />
                        </LineChart>
                    </ResponsiveContainer>
                    <p className="mt-2 text-xs text-ink/50">Seedhi line asli appointments, tooti hui line agle mahine ka andaza.</p>
                </div>

                <div className={`${card} h-fit`}>
                    <h2 className="mb-4 font-semibold">Is mahine ki bimariyan</h2>
                    {top.length === 0 ? (
                        <p className="rounded-xl bg-page py-10 text-center text-sm text-ink/60">Is mahine koi diagnosis nahi.</p>
                    ) : (
                        <ul className="space-y-4">
                            {top.map((d) => (
                                <li key={d.name}>
                                    <div className="mb-1.5 flex items-center justify-between text-sm">
                                        <span className="truncate capitalize">{d.name}</span>
                                        <span className="ml-3 font-semibold">{d.count}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-page">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${(d.count / maxTop) * 100}%` }} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <h2 className="mb-4 mt-8 font-semibold">Doctor performance</h2>
            {(data.doctorPerformance || []).length === 0 ? (
                <EmptyState icon={Activity} title="Koi doctor nahi" text="Doctors add karne ke baad yahan unki performance nazar aayegi." />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-page text-xs uppercase tracking-wide text-ink/60">
                            <tr>
                                <th className="px-5 py-3.5 font-medium">Doctor</th>
                                <th className="px-5 py-3.5 font-medium">Trend</th>
                                <th className="hidden px-5 py-3.5 font-medium sm:table-cell">Pichla mahina</th>
                                <th className="px-5 py-3.5 font-medium">Is mahine</th>
                                <th className="hidden px-5 py-3.5 font-medium md:table-cell">Completion</th>
                                <th className="hidden px-5 py-3.5 font-medium md:table-cell">Prescriptions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.doctorPerformance.map((d) => {
                                const last = d.months[d.months.length - 2];
                                const cur = d.months[d.months.length - 1];
                                return (
                                    <tr key={d.doctorId} className="border-t border-line">
                                        <td className="px-5 py-4">
                                            <p className="font-medium">Dr. {d.name}</p>
                                            {d.specialization && <p className="text-xs text-ink/60">{d.specialization}</p>}
                                        </td>
                                        <td className="px-5 py-4"><TrendBadge trend={d.trend} /></td>
                                        <td className="hidden px-5 py-4 text-ink/70 sm:table-cell">{last?.total ?? 0}</td>
                                        <td className="px-5 py-4">
                                            <span className="font-semibold">{cur?.total ?? 0}</span>
                                            <span className="text-xs text-ink/50"> ({cur?.completed ?? 0} complete)</span>
                                        </td>
                                        <td className="hidden px-5 py-4 md:table-cell">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-24 overflow-hidden rounded-full bg-page ring-1 ring-line">
                                                    <div className="h-full rounded-full bg-primary" style={{ width: `${cur?.completionRate ?? 0}%` }} />
                                                </div>
                                                <span className="text-xs text-ink/70">{cur?.completionRate ?? 0}%</span>
                                            </div>
                                        </td>
                                        <td className="hidden px-5 py-4 md:table-cell">{d.prescriptionsThisMonth}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {data.method && <p className="mt-4 text-xs text-ink/50">{data.method}</p>}
        </div>
    );
}