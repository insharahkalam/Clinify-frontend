import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg } from "../../utils/format";
import Field from "../../components/Field";
import PageHeader from "../../components/PageHeader";

const initial = {
    name: "", email: "", password: "", phone: "",
    age: "", gender: "", bloodGroup: "", address: "",
};

export default function PatientCreate() {
    const navigate = useNavigate();
    const [form, setForm] = useState(initial);
    const [loading, setLoading] = useState(false);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(ENDPOINTS.receptionist.patients, {
                ...form,
                age: form.age ? Number(form.age) : undefined,
            });
            toast.success("Patient register ho gaya");
            navigate("/patients");
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-primary-dark">
                <ArrowLeft size={16} /> Back to patients
            </Link>
            <PageHeader title="Add new patient" subtitle="Patient ka account aur medical profile banayein" />

            <form
                onSubmit={onSubmit}
                className="rounded-2xl border border-line bg-white p-7 shadow-[0_4px_20px_rgba(169,155,203,0.10)]"
            >
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Full name" name="name" value={form.name} onChange={onChange} required />
                    <Field label="Phone" name="phone" placeholder="03xx xxxxxxx" value={form.phone} onChange={onChange} />
                    <Field label="Email" type="email" name="email" value={form.email} onChange={onChange} required />
                    <Field label="Temporary password" type="password" name="password" minLength={6}
                        placeholder="Min 6 characters" value={form.password} onChange={onChange} required />
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

                <div className="mt-7 flex justify-end gap-3">
                    <Link to="/patients" className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page">
                        Cancel
                    </Link>
                    <button
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Register patient
                    </button>
                </div>
            </form>
        </div>
    );
}