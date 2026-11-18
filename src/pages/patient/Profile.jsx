import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Calendar, Check, Droplet, HeartPulse, Loader2, Mail, MapPin, Phone, RotateCcw, User } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";

const FIELDS = ["name", "phone", "age", "gender", "bloodGroup", "address"];
const GENDERS = [
    ["male", "Male"],
    ["female", "Female"],
    ["other", "Other"],
];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const inputCls =
    "w-full rounded-xl border border-line-input bg-card py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-placeholder hover:border-lavender-medium focus:border-focus focus:ring-4 focus:ring-secondary/60";

function InputField({ label, icon: Icon, required, ...props }) {
    return (
        <label className="group block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
                {label}
                {required && <span className="text-primary"> *</span>}
            </span>
            <span className="relative block">
                <Icon
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-placeholder transition-colors group-focus-within:text-primary"
                />
                <input {...props} required={required} className={inputCls} />
            </span>
        </label>
    );
}

function InfoRow({ icon: Icon, value, empty }) {
    return (
        <p className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-section">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-lavender-light text-primary">
                <Icon size={14} />
            </span>
            <span className={`min-w-0 truncate ${value ? "text-ink-secondary" : "italic text-placeholder"}`}>
                {value || empty}
            </span>
        </p>
    );
}

export default function Profile() {
    const [form, setForm] = useState(null);
    const [initial, setInitial] = useState(null);
    const [email, setEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    useEffect(() => {
        api
            .get(ENDPOINTS.patient.profile)
            .then(({ data }) => {
                const { user, patient } = data;
                const values = {
                    name: user.name || "",
                    phone: user.phone || "",
                    age: patient?.age ?? "",
                    gender: patient?.gender || "",
                    bloodGroup: patient?.bloodGroup || "",
                    address: patient?.address || "",
                };
                setEmail(user.email);
                setForm(values);
                setInitial(values);
            })
            .catch((e) => toast.error(errMsg(e)));
    }, []);

    useEffect(() => {
        if (!justSaved) return;
        const t = setTimeout(() => setJustSaved(false), 2000);
        return () => clearTimeout(t);
    }, [justSaved]);

    if (!form) return <Loader />;

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    // Click again on the selected option to clear it.
    const toggle = (name, value) => setForm({ ...form, [name]: form[name] === value ? "" : value });

    const dirty = FIELDS.some((k) => String(form[k]) !== String(initial[k]));
    const filled = FIELDS.filter((k) => String(form[k]).trim() !== "").length;
    const completeness = Math.round((filled / FIELDS.length) * 100);

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(ENDPOINTS.patient.profile, {
                ...form,
                age: form.age === "" ? undefined : Number(form.age),
            });
            setInitial(form);
            setJustSaved(true);
            toast.success("Profile update ho gayi");
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    const chip = (active) =>
        `rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60 ${active
            ? "border-primary bg-primary text-on-primary shadow-md shadow-primary/30"
            : "border-line bg-card text-ink-secondary hover:-translate-y-0.5 hover:border-lavender-medium hover:bg-lavender-light hover:text-primary"
        }`;

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader title="My Profile" subtitle="Apni personal aur medical details manage karein" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Summary card */}
                <aside className="animate-fade-up h-fit overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-shadow duration-300 hover:shadow-hover lg:sticky lg:top-6">
                    <div className="h-20 bg-ai-gradient" />
                    <div className="-mt-10 px-6 pb-6">
                        <div className="group mx-auto w-fit rounded-full bg-card p-1 shadow-card">
                            <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-3xl font-semibold text-primary-hover transition-transform duration-300 group-hover:scale-105">
                                {form.name?.trim()?.[0]?.toUpperCase() || <User size={30} />}
                            </div>
                        </div>
                        <div className="mt-3 text-center">
                            <h2 className="truncate font-semibold text-ink">{form.name || "Aapka naam"}</h2>
                            <span className="mt-1 inline-block rounded-full bg-lavender-light px-3 py-0.5 text-xs font-medium text-primary">
                                Patient
                            </span>
                        </div>

                        <div className="mt-5">
                            <div className="mb-1.5 flex justify-between text-xs">
                                <span className="font-medium text-ink-secondary">Profile complete</span>
                                <span className="font-semibold text-primary">{completeness}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-lavender-light">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                                    style={{ width: `${completeness}%` }}
                                />
                            </div>
                        </div>

                        <div className="mt-5 space-y-1 border-t border-line-light pt-4 text-sm">
                            <InfoRow icon={Mail} value={email} />
                            <InfoRow icon={Phone} value={form.phone} empty="Phone add karein" />
                            <InfoRow icon={Droplet} value={form.bloodGroup} empty="Blood group chunein" />
                            <InfoRow icon={MapPin} value={form.address} empty="Address add karein" />
                        </div>
                    </div>
                </aside>

                {/* Edit form */}
                <form
                    onSubmit={onSubmit}
                    style={{ animationDelay: "80ms" }}
                    className="animate-fade-up rounded-2xl border border-line bg-card p-6 shadow-card sm:p-7 lg:col-span-2"
                >
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2 font-semibold text-ink">
                            <User size={17} className="text-primary" /> Personal details
                        </h3>
                        {dirty && (
                            <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" /> Unsaved changes
                            </span>
                        )}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <InputField label="Full name" icon={User} name="name" value={form.name} onChange={onChange} placeholder="Masalan: Ali Khan" required />
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
                            <span className="relative block">
                                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-placeholder" />
                                <input value={email} readOnly className={`${inputCls} cursor-not-allowed bg-section text-ink-muted hover:border-line-input`} />
                            </span>
                        </label>
                        <InputField label="Phone" icon={Phone} type="tel" name="phone" value={form.phone} onChange={onChange} placeholder="03xx xxxxxxx" />
                        <InputField label="Age" icon={Calendar} type="number" name="age" min="0" max="120" value={form.age} onChange={onChange} placeholder="Saal" />
                        <div className="sm:col-span-2">
                            <InputField label="Address" icon={MapPin} name="address" value={form.address} onChange={onChange} placeholder="Ghar ka pata" />
                        </div>
                    </div>

                    <div className="mt-5">
                        <span className="mb-1.5 block text-sm font-medium text-ink">Gender</span>
                        <div className="grid grid-cols-3 gap-2 sm:max-w-sm">
                            {GENDERS.map(([value, label]) => (
                                <button key={value} type="button" aria-pressed={form.gender === value} onClick={() => toggle("gender", value)} className={chip(form.gender === value)}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-7 border-t border-line-light pt-6">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink">
                            <HeartPulse size={17} className="text-primary" /> Medical details
                        </h3>
                        <span className="mb-1.5 block text-sm font-medium text-ink">Blood group</span>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                            {BLOOD_GROUPS.map((b) => (
                                <button key={b} type="button" aria-pressed={form.bloodGroup === b} onClick={() => toggle("bloodGroup", b)} className={chip(form.bloodGroup === b)}>
                                    {b}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            disabled={!dirty || saving}
                            onClick={() => setForm(initial)}
                            className="flex items-center gap-2 rounded-xl border border-line bg-card px-5 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:border-lavender-medium hover:bg-section hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                        >
                            <RotateCcw size={15} /> Reset
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !dirty}
                            className={`group relative flex items-center gap-2 overflow-hidden rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary shadow-md shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-hover active:translate-y-0 active:bg-primary-active disabled:pointer-events-none disabled:opacity-60 ${justSaved ? "disabled:bg-success disabled:opacity-100 disabled:shadow-success/30" : ""
                                }`}
                        >
                            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-card/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                            {saving ? <Loader2 size={16} className="animate-spin" /> : justSaved ? <Check size={16} /> : null}
                            {saving ? "Saving..." : justSaved ? "Saved!" : "Save changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}