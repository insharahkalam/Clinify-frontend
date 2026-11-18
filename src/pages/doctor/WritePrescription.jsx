import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg } from "../../utils/format";
import Field from "../../components/Field";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";

const card = "rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]";
const area =
    "w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-4 focus:ring-secondary/60";
const emptyMed = { name: "", dosage: "", frequency: "", duration: "" };

export default function WritePrescription() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const appointmentId = params.get("appointment") || undefined;

    const [patients, setPatients] = useState(null);
    const [patientId, setPatientId] = useState(params.get("patient") || "");
    const [dx, setDx] = useState({ symptoms: "", diagnosis: "", notes: "" });
    const [meds, setMeds] = useState([{ ...emptyMed }]);
    const [rxNotes, setRxNotes] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api
            .get(ENDPOINTS.doctor.patients)
            .then(({ data }) => setPatients(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setPatients([]);
            });
    }, []);

    if (!patients) return <Loader />;

    const setMed = (i, patch) => setMeds((m) => m.map((x, j) => (j === i ? { ...x, ...patch } : x)));

    const submit = async (e) => {
        e.preventDefault();
        if (!patientId) return toast.error("Patient chunein");

        // Bilkul khali rows ignore, adhoori rows par error
        const filled = meds.filter((m) => m.name || m.dosage || m.frequency || m.duration);
        if (filled.some((m) => !m.name.trim() || !m.dosage.trim())) {
            return toast.error("Har medicine ka naam aur dosage zaroori hai");
        }
        const hasDx = dx.diagnosis.trim().length > 0;
        if (!hasDx && filled.length === 0) return toast.error("Diagnosis ya kam az kam ek medicine likhein");

        setSaving(true);
        try {
            if (hasDx) {
                await api.post(ENDPOINTS.doctor.diagnosis, {
                    patientId,
                    appointmentId,
                    symptoms: dx.symptoms || undefined,
                    diagnosis: dx.diagnosis,
                    notes: dx.notes || undefined,
                });
            }
            if (filled.length) {
                await api.post(ENDPOINTS.doctor.prescriptions, {
                    patientId,
                    appointmentId,
                    medicines: filled.map((m) => ({
                        name: m.name.trim(),
                        dosage: m.dosage.trim(),
                        frequency: m.frequency.trim() || undefined,
                        duration: m.duration.trim() || undefined,
                    })),
                    notes: rxNotes || undefined,
                });
            }
            toast.success("Save ho gaya");
            navigate(`/patients/${patientId}`);
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <Link to="/appointments" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-primary-dark">
                <ArrowLeft size={16} /> Back
            </Link>
            <PageHeader title="Diagnosis aur prescription" subtitle="Consultation ka record likhein" />

            <form onSubmit={submit} className="space-y-6">
                <section className={card}>
                    <h2 className="mb-4 font-semibold">1. Patient</h2>
                    <Field as="select" label="Patient" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                        <option value="">Patient chunein</option>
                        {patients.map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.user?.name} {p.user?.phone ? `(${p.user.phone})` : ""}
                            </option>
                        ))}
                    </Field>
                </section>

                <section className={card}>
                    <h2 className="mb-4 font-semibold">2. Diagnosis</h2>
                    <div className="space-y-4">
                        <Field label="Symptoms" placeholder="Masalan: bukhar, khansi, gale mein dard" value={dx.symptoms} onChange={(e) => setDx({ ...dx, symptoms: e.target.value })} />
                        <Field label="Diagnosis" placeholder="Masalan: Viral flu" value={dx.diagnosis} onChange={(e) => setDx({ ...dx, diagnosis: e.target.value })} />
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">Notes</span>
                            <textarea rows={3} className={area} value={dx.notes} onChange={(e) => setDx({ ...dx, notes: e.target.value })} />
                        </label>
                    </div>
                </section>

                <section className={card}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-semibold">3. Medicines</h2>
                        <button
                            type="button"
                            onClick={() => setMeds([...meds, { ...emptyMed }])}
                            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-primary-dark transition hover:bg-page"
                        >
                            <Plus size={14} /> Medicine add karein
                        </button>
                    </div>

                    <div className="space-y-4">
                        {meds.map((m, i) => (
                            <div key={i} className="rounded-xl border border-line bg-page/50 p-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field label="Naam" placeholder="Paracetamol" value={m.name} onChange={(e) => setMed(i, { name: e.target.value })} />
                                    <Field label="Dosage" placeholder="500mg" value={m.dosage} onChange={(e) => setMed(i, { dosage: e.target.value })} />
                                    <Field label="Frequency" placeholder="Din mein 3 baar" value={m.frequency} onChange={(e) => setMed(i, { frequency: e.target.value })} />
                                    <Field label="Duration" placeholder="5 din" value={m.duration} onChange={(e) => setMed(i, { duration: e.target.value })} />
                                </div>
                                {meds.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setMeds(meds.filter((_, j) => j !== i))}
                                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-500 hover:underline"
                                    >
                                        <Trash2 size={13} /> Hata dein
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <label className="mt-5 block">
                        <span className="mb-1.5 block text-sm font-medium">Prescription notes (optional)</span>
                        <textarea rows={3} className={area} placeholder="Khane ke baad lein, aaram karein..." value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} />
                    </label>
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
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
}