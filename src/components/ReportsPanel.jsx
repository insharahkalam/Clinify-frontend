import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Download, Eye, FileText, Image as ImageIcon, Loader2, Trash2, Upload, FolderOpen } from "lucide-react";
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { errMsg, formatDate, formatBytes } from "../utils/format";
import { downloadReport } from "../utils/reportFile";
import Field from "./Field";
import Modal from "./Modal";
import EmptyState from "./EmptyState";
import ReportViewer from "./ReportViewer";

const MAX_MB = 5;
const CATEGORIES = [
    ["lab_report", "Lab report"],
    ["xray", "X-ray"],
    ["scan", "Scan"],
    ["other", "Other"],
];
const label = (c) => CATEGORIES.find(([k]) => k === c)?.[1] || "Other";
const card = "rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]";
const initial = { title: "", category: "lab_report", notes: "" };

export default function ReportsPanel({ patientId }) {
    const { user } = useAuth();
    const fileRef = useRef(null);
    const [items, setItems] = useState(null);
    const [form, setForm] = useState(initial);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [viewing, setViewing] = useState(null);

    const load = useCallback(
        () =>
            api
                .get(ENDPOINTS.reports.base, { params: patientId ? { patientId } : {} })
                .then(({ data }) => setItems(data))
                .catch((e) => {
                    toast.error(errMsg(e));
                    setItems([]);
                }),
        [patientId]
    );

    useEffect(() => {
        setItems(null);
        load();
    }, [load]);

    const pickFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return setFile(null);
        if (f.size > MAX_MB * 1024 * 1024) {
            toast.error(`File ${MAX_MB} MB se choti honi chahiye`);
            e.target.value = "";
            return setFile(null);
        }
        setFile(f);
        setForm((p) => (p.title ? p : { ...p, title: f.name.replace(/\.[^.]+$/, "").slice(0, 100) }));
    };

    const upload = async (e) => {
        e.preventDefault();
        if (!file) return toast.error("Pehle file chunein");
        if (!form.title.trim()) return toast.error("Report ka title likhein");

        const fd = new FormData();
        fd.append("title", form.title.trim());
        fd.append("category", form.category);
        if (form.notes.trim()) fd.append("notes", form.notes.trim());
        if (patientId) fd.append("patientId", patientId);
        fd.append("file", file);

        setUploading(true);
        try {
            await api.post(ENDPOINTS.reports.base, fd);
            toast.success("Report upload ho gayi");
            setForm(initial);
            setFile(null);
            if (fileRef.current) fileRef.current.value = "";
            await load();
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setUploading(false);
        }
    };

    const remove = async () => {
        setDeleting(true);
        try {
            await api.delete(ENDPOINTS.reports.remove(target._id));
            toast.success("Report hata di gayi");
            setTarget(null);
            await load();
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setDeleting(false);
        }
    };

    const canDelete = (r) => user.role === "receptionist" || (r.uploadedBy?._id || r.uploadedBy) === user.id;

    return (
        <div className="space-y-6">
            <form onSubmit={upload} className={card}>
                <div className="mb-4 flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/60 text-primary-dark">
                        <Upload size={18} />
                    </div>
                    <h2 className="font-semibold">Nayi report upload karein</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Title" placeholder="Masalan: CBC blood test" maxLength={100}
                        value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    <Field as="select" label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        {CATEGORIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Field>
                </div>

                <label className="mt-4 block">
                    <span className="mb-1.5 block text-sm font-medium">Notes (optional)</span>
                    <textarea
                        rows={2}
                        maxLength={500}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-4 focus:ring-secondary/60"
                    />
                </label>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer rounded-xl border border-dashed border-primary bg-page px-4 py-2.5 text-sm font-medium text-primary-dark transition hover:bg-secondary/40">
                        {file ? "File badlein" : "File chunein"}
                        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={pickFile} className="hidden" />
                    </label>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink/60">
                        {file ? `${file.name} (${formatBytes(file.size)})` : `JPG, PNG, WebP ya PDF, max ${MAX_MB} MB`}
                    </span>
                    <button
                        disabled={uploading}
                        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60"
                    >
                        {uploading && <Loader2 size={16} className="animate-spin" />}
                        Upload
                    </button>
                </div>
            </form>

            {!items ? (
                <div className="grid place-items-center py-10 text-primary"><Loader2 className="animate-spin" size={24} /></div>
            ) : items.length === 0 ? (
                <EmptyState icon={FolderOpen} title="Abhi koi report nahi" text="Upload ki hui reports yahan nazar aayengi." />
            ) : (
                <div className="space-y-3">
                    {items.map((r) => {
                        const Icon = r.file?.format === "pdf" ? FileText : ImageIcon;
                        return (
                            <div key={r._id} className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-line bg-white p-4 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary/60 text-primary-dark">
                                    <Icon size={20} />
                                </div>

                                <div className="min-w-0 flex-1 basis-48">
                                    <p className="truncate text-sm font-semibold">{r.title}</p>
                                    <p className="truncate text-xs text-ink/60">
                                        {label(r.category)} • {formatBytes(r.file?.bytes)} • {formatDate(r.createdAt)}
                                        {r.uploadedBy?.name ? ` • ${r.uploadedBy.name}` : ""}
                                    </p>
                                    {r.notes && <p className="mt-0.5 truncate text-xs text-ink/50">{r.notes}</p>}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setViewing(r)} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink/70 transition hover:bg-page">
                                        <Eye size={14} /> View
                                    </button>
                                    <button type="button" onClick={() => downloadReport(r._id, r.file?.originalName)} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink/70 transition hover:bg-page" aria-label="Download">
                                        <Download size={14} />
                                    </button>
                                    {canDelete(r) && (
                                        <button type="button" onClick={() => setTarget(r)} className="flex items-center gap-1.5 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50" aria-label="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {target && (
                <Modal title="Report hata dein?" onClose={() => setTarget(null)}>
                    <p className="text-sm text-ink/70">
                        <span className="font-medium text-ink">{target.title}</span> hamesha ke liye hat jayegi.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setTarget(null)} className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page">Wapis</button>
                        <button onClick={remove} disabled={deleting} className="flex items-center gap-2 rounded-xl bg-red-400 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60">
                            {deleting && <Loader2 size={16} className="animate-spin" />}
                            Haan, hata dein
                        </button>
                    </div>
                </Modal>
            )}

            {viewing && <ReportViewer report={viewing} onClose={() => setViewing(null)} />}
        </div>
    );
}