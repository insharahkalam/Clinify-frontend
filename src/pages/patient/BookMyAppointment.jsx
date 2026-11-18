import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, todayStr } from "../../utils/format";
import Field from "../../components/Field";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import SlotPicker from "../../components/SlotPicker";

export default function BookMyAppointment() {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState(null);
    const [form, setForm] = useState({ doctorId: "", date: todayStr(), timeSlot: "", reason: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api
            .get(ENDPOINTS.appointments.doctors)
            .then(({ data }) => setDoctors(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setDoctors([]);
            });
    }, []);

    if (!doctors) return <Loader />;

    const set = (patch) => setForm((f) => ({ ...f, ...patch }));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.doctorId) return toast.error("Doctor chunein");
        if (!form.timeSlot) return toast.error("Time slot chunein");

        setSaving(true);
        try {
            await api.post(ENDPOINTS.appointments.book, {
                doctorId: form.doctorId,
                date: form.date,
                timeSlot: form.timeSlot,
                reason: form.reason || undefined,
            });
            toast.success("Appointment book ho gayi");
            navigate("/appointments");
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    const card = "rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]";

    return (
        <div className="mx-auto max-w-3xl">
            <Link to="/appointments" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-primary-dark">
                <ArrowLeft size={16} /> Back to appointments
            </Link>
            <PageHeader title="Book appointment" subtitle="Doctor, din aur time chunein" />

            <form onSubmit={submit} className="space-y-6">
                <section className={card}>
                    <h2 className="mb-4 font-semibold">1. Doctor aur date</h2>
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

                <section className={card}>
                    <h2 className="mb-4 font-semibold">2. Time slot</h2>
                    <SlotPicker
                        doctorId={form.doctorId}
                        date={form.date}
                        value={form.timeSlot}
                        onChange={(timeSlot) => set({ timeSlot })}
                    />
                </section>

                <section className={card}>
                    <h2 className="mb-4 font-semibold">3. Wajah (optional)</h2>
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