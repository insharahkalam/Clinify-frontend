import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Pencil, X } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatDate } from "../../utils/format";
import Field from "../../components/Field";
import Loader from "../../components/Loader";
import { CalendarPlus } from "lucide-react";
import PatientAppointments from "./PatientAppointments";
import ReportsPanel from "../../components/ReportsPanel";

export default function PatientDetail() {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    const load = () =>
        api
            .get(ENDPOINTS.receptionist.patient(id))
            .then(({ data }) => {
                // Response alag shape mein ho sakta hai: {patient} ya direct patient
                const p = data.patient || data;
                if (!p.user && data.user) p.user = data.user;
                setPatient(p);
                setForm({
                    name: p.user?.name || "",
                    phone: p.user?.phone || "",
                    age: p.age ?? "",
                    gender: p.gender || "",
                    bloodGroup: p.bloodGroup || "",
                    address: p.address || "",
                    medicalNotes: p.medicalNotes || "",
                });
            })
            .catch((e) => toast.error(errMsg(e)));

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, [id]);

    if (!patient) return <Loader />;

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(ENDPOINTS.receptionist.patient(id), {
                ...form,
                age: form.age === "" ? undefined : Number(form.age),
            });
            toast.success("Patient update ho gaya");
            setEditing(false);
            await load();
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    const rows = [
        ["Email", patient.user?.email],
        ["Phone", patient.user?.phone],
        ["Age", patient.age],
        ["Gender", patient.gender],
        ["Blood group", patient.bloodGroup],
        ["Address", patient.address],
        ["Registered on", formatDate(patient.createdAt)],
    ];

    return (
        <div className="mx-auto max-w-4xl">
            <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-primary-dark">
                <ArrowLeft size={16} /> Back to patients
            </Link>

            <div className="rounded-2xl border border-line bg-white p-7 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-2xl font-semibold text-primary-dark">
                            {patient.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{patient.user?.name}</h1>
                            <p className="text-sm text-ink/60">Patient</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to={`/appointments/new?patient=${id}`}
                            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark"
                        >
                            <CalendarPlus size={15} /> Book appointment
                        </Link>
                        <button
                            onClick={() => setEditing(!editing)}
                            className="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-page"
                        >
                            {editing ? <><X size={15} /> Cancel</> : <><Pencil size={15} /> Edit</>}
                        </button>
                    </div>
                </div>

                <div className="my-6 border-t border-line" />

                {editing ? (
                    <form onSubmit={onSubmit}>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Full name" name="name" value={form.name} onChange={onChange} required />
                            <Field label="Phone" name="phone" value={form.phone} onChange={onChange} />
                            <Field label="Age" type="number" name="age" min="0" max="120" value={form.age} onChange={onChange} />
                            <Field as="select" label="Gender" name="gender" value={form.gender} onChange={onChange}>
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </Field>
                            <Field as="select" label="Blood group" name="bloodGroup" value={form.bloodGroup} onChange={onChange}>
                                <option value="">Select</option>
                                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </Field>
                            <Field label="Address" name="address" value={form.address} onChange={onChange} />
                        </div>

                        <div className="mt-7 flex justify-end">
                            <button
                                disabled={saving}
                                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60"
                            >
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                Save changes
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                            {rows.map(([label, value]) => (
                                <div key={label}>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</dt>
                                    <dd className="mt-1 text-sm capitalize-first">{value || "—"}</dd>
                                </div>
                            ))}
                        </dl>

                        {patient.medicalNotes && (
                            <div className="mt-6 rounded-xl bg-page p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Medical notes</p>
                                <p className="mt-1 text-sm">{patient.medicalNotes}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
            <PatientAppointments patientId={id} />
            <h2 className="mb-4 mt-8 font-semibold">Reports</h2>
            <ReportsPanel patientId={id} />
        </div>
    );
}