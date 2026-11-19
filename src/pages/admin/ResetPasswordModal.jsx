import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Shuffle } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg } from "../../utils/format";
import Modal from "../../components/Modal";
import Field from "../../components/Field";

const generate = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = new Uint32Array(10);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (n) => chars[n % chars.length]).join("");
};

export default function ResetPasswordModal({ staff, onClose }) {
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (password.length < 8) return toast.error("Password kam az kam 8 characters ka ho");
        setSaving(true);
        try {
            const { data } = await api.put(ENDPOINTS.admin.staffPassword(staff._id), { password });
            toast.success(data.message);
            onClose();
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Password reset karein" onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <p className="text-sm text-ink/70">
                    <span className="font-medium text-ink">{staff.name}</span> ka naya password likhein, ya neeche se bana lein.
                    Ye password {staff.name} ko khud batana hoga.
                </p>
                <Field label="Naya password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kam az kam 8 characters" required />
                <button type="button" onClick={() => setPassword(generate())} className="flex items-center gap-1.5 text-xs font-medium text-primary-dark hover:underline">
                    <Shuffle size={13} /> Random password banayein
                </button>

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page">
                        Cancel
                    </button>
                    <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60">
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        Reset karein
                    </button>
                </div>
            </form>
        </Modal>
    );
}