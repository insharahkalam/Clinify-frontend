import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, todayStr } from "../../utils/format";
import Field from "../../components/Field";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import SlotPicker from "../../components/SlotPicker";

export default function BookAppointment() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const [patients, setPatients] = useState(null);
    const [doctors, setDoctors] = useState(null);
    const [patientId, setPatientId] = useState(params.get("patient") || "");
    const [q, setQ] = useState("");
    const [form, setForm] = useState({ doctorId: "", date: todayStr(), timeSlot: "", reason: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([api.get(ENDPOINTS.receptionist.patients), api.get(ENDPOINTS.appointments.doctors)])
            .then(([p, d]) => {
                setPatients(Array.isArray(p.data) ? p.data : p.data.patients || []);
                setDoctors(d.data);
            })
            .catch((e) => {
                toast.error(errMsg(e));
                setPatients([]);
                setDoctors([]);
            });
    }, []);

    const selected = useMemo(() => patients?.find((p) => p._id === patientId), [patients, patientId]);

    const matches = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!patients || !s) return [];
        return patients
            .filter((p) => [p.user?.name, p.user?.email, p.user?.phone].some((v) => v?.toLowerCase().includes(s)))
            .slice(0, 5);
    }, [patients, q]);

    if (!patients || !doctors) return <Loader />;

    const set = (patch) => setForm((f) => ({ ...f, ...patch }));

    const submit = async (e) => {
        e.preventDefault();
        if (!patientId) return toast.error("Patient chunein");
        if (!form.doctorId) return toast.error("Doctor chunein");
        if (!form.timeSlot) return toast.error("Time slot chunein");

        setSaving(true);
        try {
            await api.post(ENDPOINTS.appointments.book, {
                patientId,
                doctorId: form.doctorId,
                date: form.date,
                timeSlot: form.timeSlot,
                reason: form.reason || undefined,
            });
            toast.success("Appointment book ho gayi");
            navigate(`/appointments?date=${form.date}`);
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <Link to="/appointments" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-primary-dark">
                <ArrowLeft size={16} /> Back to appointments
            </Link>
            <PageHeader title="Book appointment" subtitle="Patient, doctor aur time chunein" />

            <form onSubmit={submit} className="space-y-6">
                {/* 1. Patient */}
                <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                    <h2 className="mb-4 font-semibold">1. Patient</h2>

                    {selected ? (
                        <div className="flex items-center justify-between rounded-xl bg-page p-3.5">
                            <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-semibold text-primary-dark">
                                    {selected.user?.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{selected.user?.name}</p>
                                    <p className="text-xs text-ink/60">{selected.user?.phone || selected.user?.email}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setPatientId("")} className="rounded-lg p-2 text-ink/50 transition hover:bg-white" aria-label="Change patient">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Name, email ya phone se patient dhoondein"
                                    className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-4 focus:ring-secondary/60"
                                />
                            </div>

                            {matches.length > 0 && (
                                <ul className="mt-2 overflow-hidden rounded-xl border border-line">
                                    {matches.map((p) => (
                                        <li key={p._id}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPatientId(p._id);
                                                    setQ("");
                                                }}
                                                className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition last:border-b-0 hover:bg-page"
                                            >
                                                <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary-dark">
                                                    {p.user?.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{p.user?.name}</p>
                                                    <p className="text-xs text-ink/60">{p.user?.phone || p.user?.email}</p>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {q.trim() && matches.length === 0 && (
                                <p className="mt-3 text-sm text-ink/60">
                                    Koi patient nahi mila.{" "}
                                    <Link to="/patients/new" className="font-semibold text-primary-dark hover:underline">
                                        Naya register karein
                                    </Link>
                                </p>
                            )}
                        </>
                    )}
                </section>

                {/* 2. Doctor + date */}
                <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                    <h2 className="mb-4 font-semibold">2. Doctor aur date</h2>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                            as="select"
                            label="Doctor"
                            value={form.doctorId}
                            onChange={(e) => set({ doctorId: e.target.value, timeSlot: "" })}
                        >
                            <option value="">Doctor chunein</option>
                            {doctors.map((d) => (
                                <option key={d._id} value={d._id}>Dr. {d.name}</option>
                            ))}
                        </Field>
                        <Field
                            label="Date"
                            type="date"
                            min={todayStr()}
                            value={form.date}
                            onChange={(e) => set({ date: e.target.value, timeSlot: "" })}
                        />
                    </div>
                </section>

                {/* 3. Slot */}
                <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                    <h2 className="mb-4 font-semibold">3. Time slot</h2>
                    <SlotPicker
                        doctorId={form.doctorId}
                        date={form.date}
                        value={form.timeSlot}
                        onChange={(timeSlot) => set({ timeSlot })}
                    />
                </section>

                {/* 4. Reason */}
                <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                    <h2 className="mb-4 font-semibold">4. Wajah (optional)</h2>
                    <textarea
                        rows={3}
                        value={form.reason}
                        onChange={(e) => set({ reason: e.target.value })}
                        placeholder="Masalan: bukhar aur khansi"
                        className="w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-4 focus:ring-secondary/60"
                    />
                </section>

                <div className="flex justify-end gap-3">
                    <Link to="/appointments" className="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page">
                        Cancel
                    </Link>
                    <button
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-primary px-7 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60"
                    >
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        Book appointment
                    </button>
                </div>
            </form>
        </div>
    );
}