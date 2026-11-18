import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatDate } from "../../utils/format";
import Field from "../../components/Field";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";

const empty = { name: "", email: "", password: "", phone: "", specialization: "" };

export default function StaffManager({ role, title, subtitle, noun, addLabel, icon: Icon }) {
    const isDoctor = role === "doctor";
    const [items, setItems] = useState(null);
    const [q, setQ] = useState("");
    const [modal, setModal] = useState(null); // { mode: "create" | "edit", staff? }
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(
        () =>
            api
                .get(ENDPOINTS.admin.staff, { params: { role } })
                .then(({ data }) => setItems(data))
                .catch((e) => {
                    toast.error(errMsg(e));
                    setItems([]);
                }),
        [role]
    );

    useEffect(() => {
        setItems(null);
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!items) return [];
        if (!s) return items;
        return items.filter((x) => [x.name, x.email, x.phone, x.specialization].some((v) => v?.toLowerCase().includes(s)));
    }, [items, q]);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const openCreate = () => {
        setForm(empty);
        setModal({ mode: "create" });
    };
    const openEdit = (s) => {
        setForm({ ...empty, name: s.name || "", email: s.email || "", phone: s.phone || "", specialization: s.specialization || "" });
        setModal({ mode: "edit", staff: s });
    };

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (modal.mode === "create") {
                await api.post(ENDPOINTS.admin.staff, {
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    phone: form.phone.trim() || undefined,
                    role,
                    specialization: isDoctor ? form.specialization.trim() || undefined : undefined,
                });
                toast.success(`${noun} ban gaya`);
            } else {
                await api.put(ENDPOINTS.admin.staffOne(modal.staff._id), {
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    specialization: isDoctor ? form.specialization.trim() : undefined,
                });
                toast.success("Update ho gaya");
            }
            setModal(null);
            await load();
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        setDeleting(true);
        try {
            await api.delete(ENDPOINTS.admin.staffOne(target._id));
            toast.success(`${noun} hata diya gaya`);
            setTarget(null);
            await load();
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setDeleting(false);
        }
    };

    if (!items) return <Loader />;

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title={title}
                subtitle={`${items.length} ${subtitle}`}
                action={
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark"
                    >
                        <Plus size={16} /> {addLabel}
                    </button>
                }
            />

            <div className="relative mb-5 max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Naam, email ya phone se dhoondein"
                    className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-4 focus:ring-secondary/60"
                />
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={Icon} title={`Koi ${noun.toLowerCase()} nahi mila`} text={`Upar button se naya ${noun.toLowerCase()} add karein.`} />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-page text-xs uppercase tracking-wide text-ink/60">
                            <tr>
                                <th className="px-5 py-3.5 font-medium">{noun}</th>
                                <th className="hidden px-5 py-3.5 font-medium sm:table-cell">Phone</th>
                                {isDoctor && <th className="hidden px-5 py-3.5 font-medium md:table-cell">Specialization</th>}
                                <th className="hidden px-5 py-3.5 font-medium lg:table-cell">Joined</th>
                                <th className="px-5 py-3.5" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s) => (
                                <tr key={s._id} className="border-t border-line">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary-dark">
                                                {s.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{s.name}</p>
                                                <p className="truncate text-xs text-ink/60">{s.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-5 py-4 text-ink/70 sm:table-cell">{s.phone || "—"}</td>
                                    {isDoctor && (
                                        <td className="hidden px-5 py-4 md:table-cell">
                                            {s.specialization ? (
                                                <span className="rounded-full bg-secondary/60 px-2.5 py-1 text-xs font-medium text-primary-dark">{s.specialization}</span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                    )}
                                    <td className="hidden px-5 py-4 text-ink/70 lg:table-cell">{formatDate(s.createdAt)}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEdit(s)} className="rounded-lg border border-line p-2 text-ink/60 transition hover:bg-page" aria-label="Edit">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => setTarget(s)} className="rounded-lg border border-red-100 p-2 text-red-500 transition hover:bg-red-50" aria-label="Delete">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal && (
                <Modal title={modal.mode === "create" ? addLabel : `${noun} edit karein`} onClose={() => setModal(null)}>
                    <form onSubmit={save} className="space-y-4">
                        <Field label="Full name" name="name" value={form.name} onChange={onChange} required />
                        <Field label="Email" type="email" name="email" value={form.email} onChange={onChange} required disabled={modal.mode === "edit"} />
                        {modal.mode === "create" && (
                            <Field label="Temporary password" type="password" name="password" minLength={6} placeholder="Min 6 characters" value={form.password} onChange={onChange} required />
                        )}
                        <Field label="Phone" name="phone" placeholder="03xx xxxxxxx" value={form.phone} onChange={onChange} />
                        {isDoctor && (
                            <Field label="Specialization" name="specialization" placeholder="Masalan: General Physician" value={form.specialization} onChange={onChange} />
                        )}

                        {modal.mode === "edit" && <p className="text-xs text-ink/50">Email aur password yahan se nahi badal sakte.</p>}

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page">
                                Cancel
                            </button>
                            <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60">
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                Save
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {target && (
                <Modal title={`${noun} hata dein?`} onClose={() => setTarget(null)}>
                    <p className="text-sm text-ink/70">
                        <span className="font-medium text-ink">{target.name}</span> ka account hamesha ke liye delete ho jayega.
                        {isDoctor && " Is doctor ki purani appointments mein naam khali nazar aa sakta hai."}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setTarget(null)} className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page">
                            Wapis
                        </button>
                        <button onClick={remove} disabled={deleting} className="flex items-center gap-2 rounded-xl bg-red-400 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60">
                            {deleting && <Loader2 size={16} className="animate-spin" />}
                            Haan, hata dein
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}