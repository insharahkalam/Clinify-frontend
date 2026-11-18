import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, Users, ChevronRight } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";

export default function DoctorPatients() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState(null);
    const [q, setQ] = useState("");

    useEffect(() => {
        api
            .get(ENDPOINTS.doctor.patients)
            .then(({ data }) => setPatients(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setPatients([]);
            });
    }, []);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!patients) return [];
        if (!s) return patients;
        return patients.filter((p) => [p.user?.name, p.user?.email, p.user?.phone].some((v) => v?.toLowerCase().includes(s)));
    }, [patients, q]);

    if (!patients) return <Loader />;

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader title="My Patients" subtitle={`${patients.length} patients aap ke saath registered hain`} />

            <div className="relative mb-5 max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Name, email ya phone se dhoondein"
                    className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-4 focus:ring-secondary/60"
                />
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={Users} title="Koi patient nahi mila" text="Jin patients ki aap ke saath appointment hogi wo yahan aayenge." />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-page text-xs uppercase tracking-wide text-ink/60">
                            <tr>
                                <th className="px-5 py-3.5 font-medium">Patient</th>
                                <th className="hidden px-5 py-3.5 font-medium sm:table-cell">Phone</th>
                                <th className="hidden px-5 py-3.5 font-medium md:table-cell">Age / Gender</th>
                                <th className="hidden px-5 py-3.5 font-medium md:table-cell">Blood</th>
                                <th className="w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p._id} onClick={() => navigate(`/patients/${p._id}`)} className="cursor-pointer border-t border-line transition hover:bg-page/70">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary-dark">
                                                {p.user?.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{p.user?.name}</p>
                                                <p className="truncate text-xs text-ink/60">{p.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-5 py-4 text-ink/70 sm:table-cell">{p.user?.phone || "—"}</td>
                                    <td className="hidden px-5 py-4 capitalize text-ink/70 md:table-cell">
                                        {p.age ?? "—"} {p.gender ? `• ${p.gender}` : ""}
                                    </td>
                                    <td className="hidden px-5 py-4 md:table-cell">
                                        {p.bloodGroup ? (
                                            <span className="rounded-full bg-secondary/60 px-2.5 py-1 text-xs font-medium text-primary-dark">{p.bloodGroup}</span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="pr-4 text-ink/40"><ChevronRight size={18} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}