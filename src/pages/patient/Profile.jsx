import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Mail, Phone, Droplet, MapPin } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg } from "../../utils/format";
import Field from "../../components/Field";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";

export default function Profile() {
    const [form, setForm] = useState(null);
    const [email, setEmail] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api
            .get(ENDPOINTS.patient.profile)
            .then(({ data }) => {
                const { user, patient } = data;
                setEmail(user.email);
                setForm({
                    name: user.name || "",
                    phone: user.phone || "",
                    age: patient?.age ?? "",
                    gender: patient?.gender || "",
                    bloodGroup: patient?.bloodGroup || "",
                    address: patient?.address || "",
                });
            })
            .catch((e) => toast.error(errMsg(e)));
    }, []);

    if (!form) return <Loader />;

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(ENDPOINTS.patient.profile, {
                ...form,
                age: form.age === "" ? undefined : Number(form.age),
            });
            toast.success("Profile update ho gayi");
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader title="My Profile" subtitle="Apni personal aur medical details manage karein" />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Summary card */}
                <div className="h-fit rounded-2xl border border-line bg-white p-6 text-center shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                    <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-secondary text-3xl font-semibold text-primary-dark">
                        {form.name?.[0]?.toUpperCase()}
                    </div>
                    <h2 className="mt-4 font-semibold">{form.name}</h2>
                    <p className="text-xs text-ink/60">Patient</p>

                    <div className="mt-5 space-y-3 border-t border-line pt-5 text-left text-sm">
                        <p className="flex items-center gap-2.5 text-ink/70"><Mail size={15} className="text-primary" /> {email}</p>
                        {form.phone && <p className="flex items-center gap-2.5 text-ink/70"><Phone size={15} className="text-primary" /> {form.phone}</p>}
                        {form.bloodGroup && <p className="flex items-center gap-2.5 text-ink/70"><Droplet size={15} className="text-primary" /> {form.bloodGroup}</p>}
                        {form.address && <p className="flex items-center gap-2.5 text-ink/70"><MapPin size={15} className="text-primary" /> {form.address}</p>}
                    </div>
                </div>

                {/* Edit form */}
                <form
                    onSubmit={onSubmit}
                    className="rounded-2xl border border-line bg-white p-7 shadow-[0_4px_20px_rgba(169,155,203,0.10)] lg:col-span-2"
                >
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
            </div>
        </div>
    );
}