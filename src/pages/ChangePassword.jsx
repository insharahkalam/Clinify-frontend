import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { errMsg } from "../utils/format";
import Field from "../components/Field";
import PageHeader from "../components/PageHeader";

const initial = { currentPassword: "", newPassword: "", confirm: "" };

export default function ChangePassword() {
    const [form, setForm] = useState(initial);
    const [show, setShow] = useState(false);
    const [saving, setSaving] = useState(false);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const type = show ? "text" : "password";

    const submit = async (e) => {
        e.preventDefault();
        if (form.newPassword.length < 8) return toast.error("Naya password kam az kam 8 characters ka ho");
        if (form.newPassword !== form.confirm) return toast.error("Dono naye passwords mel nahi khate");

        setSaving(true);
        try {
            await api.put(ENDPOINTS.account.password, {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            toast.success("Password badal gaya");
            setForm(initial);
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-lg">
            <PageHeader title="Password badlein" subtitle="Apne account ki hifazat ke liye mazboot password rakhein" />

            <form onSubmit={submit} className="space-y-5 rounded-2xl border border-line bg-white p-7 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                <Field label="Maujooda password" type={type} name="currentPassword" value={form.currentPassword} onChange={onChange} required />
                <Field label="Naya password" type={type} name="newPassword" minLength={8} placeholder="Kam az kam 8 characters" value={form.newPassword} onChange={onChange} required />
                <Field label="Naya password dobara" type={type} name="confirm" value={form.confirm} onChange={onChange} required />

                <label className="flex items-center gap-2 text-sm text-ink/70">
                    <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-primary" />
                    Password dikhayein
                </label>

                <button
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60"
                >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Password badlein
                </button>
            </form>
        </div>
    );
}