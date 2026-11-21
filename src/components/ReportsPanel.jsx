import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    AlertTriangle,
    CalendarDays,
    CloudUpload,
    Download,
    Eye,
    FileText,
    FolderOpen,
    HardDrive,
    Image as ImageIcon,
    Loader2,
    Trash2,
    Upload,
    User,
    X,
} from "lucide-react";
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
const ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";
const CATEGORIES = [
    ["lab_report", "Lab report"],
    ["xray", "X-ray"],
    ["scan", "Scan"],
    ["other", "Other"],
];
const label = (c) => CATEGORIES.find(([k]) => k === c)?.[1] || "Other";
const initial = { title: "", category: "lab_report", notes: "" };

/* ---------- shared styles ---------- */
const card = "rounded-2xl border border-line bg-white shadow-[0_4px_20px_rgba(169,155,203,0.10)]";
const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const iconBtn = `grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-ink/60 transition-all hover:border-primary/40 hover:bg-page hover:text-primary-dark active:scale-95 ${focusRing}`;

/* ---------- small pieces ---------- */
function SkeletonList() {
    return (
        <div className="space-y-3">
            {[0, 1, 2].map((i) => (
                <div key={i} className={`${card} flex animate-pulse items-center gap-4 p-4`}>
                    <div className="h-12 w-12 rounded-xl bg-page" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-1/3 rounded bg-page" />
                        <div className="h-3 w-1/2 rounded bg-page" />
                    </div>
                    <div className="h-9 w-24 rounded-xl bg-page" />
                </div>
            ))}
        </div>
    );
}

function ReportRow({ r, canDelete, onView, onDelete }) {
    const isPdf = r.file?.format === "pdf";
    const Icon = isPdf ? FileText : ImageIcon;

    return (
        <div className={`${card} group flex flex-wrap items-center gap-x-5 gap-y-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(169,155,203,0.18)]`}>
            <button
                type="button"
                onClick={onView}
                className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-secondary to-secondary/40 text-primary-dark transition-transform group-hover:scale-105 ${focusRing}`}
                aria-label={`${r.title} dekhein`}
            >
                <Icon size={20} />
                <span className="absolute -bottom-1.5 rounded-md bg-white px-1.5 text-[9px] font-bold uppercase tracking-wide text-primary-dark ring-1 ring-line">
                    {isPdf ? "PDF" : "IMG"}
                </span>
            </button>

            <div className="min-w-0 flex-1 basis-56">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{r.title}</p>
                    <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">
                        {label(r.category)}
                    </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/55">
                    <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} /> {formatDate(r.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <HardDrive size={12} /> {formatBytes(r.file?.bytes)}
                    </span>
                    {r.uploadedBy?.name && (
                        <span className="inline-flex items-center gap-1">
                            <User size={12} /> {r.uploadedBy.name}
                        </span>
                    )}
                </div>

                {r.notes && <p className="mt-1.5 line-clamp-1 text-xs italic text-ink/50">"{r.notes}"</p>}
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onView}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md active:scale-95 ${focusRing}`}
                >
                    <Eye size={14} /> View
                </button>
                <button
                    type="button"
                    onClick={() => downloadReport(r._id, r.file?.originalName)}
                    className={iconBtn}
                    aria-label="Download"
                    title="Download"
                >
                    <Download size={15} />
                </button>
                {canDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className={`grid h-9 w-9 place-items-center rounded-xl border border-red-100 bg-white text-red-500 transition-all hover:border-red-200 hover:bg-red-50 active:scale-95 ${focusRing}`}
                        aria-label="Delete"
                        title="Delete"
                    >
                        <Trash2 size={15} />
                    </button>
                )}
            </div>
        </div>
    );
}

/* ---------- main ---------- */
export default function ReportsPanel({ patientId, readOnly = false }) {
    const { user } = useAuth();
    const fileRef = useRef(null);
    const [items, setItems] = useState(null);
    const [form, setForm] = useState(initial);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [filter, setFilter] = useState("all");

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

    const clearFile = () => {
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const acceptFile = (f) => {
        if (!f) return clearFile();
        const ext = f.name.split(".").pop()?.toLowerCase();
        if (!["jpg", "jpeg", "png", "webp", "pdf"].includes(ext)) {
            toast.error("Sirf JPG, PNG, WebP ya PDF file chalegi");
            return clearFile();
        }
        if (f.size > MAX_MB * 1024 * 1024) {
            toast.error(`File ${MAX_MB} MB se choti honi chahiye`);
            return clearFile();
        }
        setFile(f);
        setForm((p) => (p.title ? p : { ...p, title: f.name.replace(/\.[^.]+$/, "").slice(0, 100) }));
    };

    const pickFile = (e) => acceptFile(e.target.files?.[0]);

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        acceptFile(e.dataTransfer.files?.[0]);
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
            clearFile();
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

    const counts = useMemo(() => {
        const c = { all: items?.length || 0 };
        (items || []).forEach((r) => (c[r.category] = (c[r.category] || 0) + 1));
        return c;
    }, [items]);

    const visible = useMemo(
        () => (filter === "all" ? items || [] : (items || []).filter((r) => r.category === filter)),
        [items, filter]
    );

    const FileIcon = file?.type === "application/pdf" ? FileText : ImageIcon;

    return (
        <div className="space-y-6">
            {/* ---------- upload form ---------- */}
            {!readOnly && (
                <form onSubmit={upload} className={`${card} overflow-hidden`}>
                    <div className="flex items-center gap-3 border-b border-line bg-page/40 px-6 py-4">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-secondary to-secondary/40 text-primary-dark">
                            <Upload size={18} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-ink">Nayi report upload karein</h2>
                            <p className="text-xs text-ink/55">Lab reports, X-rays aur scans ek jagah mehfooz rakhein</p>
                        </div>
                    </div>

                    <div className="space-y-4 p-6">
                        {/* dropzone */}
                        {!file ? (
                            <label
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all ${dragOver
                                        ? "scale-[1.01] border-primary bg-secondary/40"
                                        : "border-line bg-page/50 hover:border-primary/50 hover:bg-page"
                                    }`}
                            >
                                <div className={`grid h-12 w-12 place-items-center rounded-full bg-white text-primary shadow-sm ring-1 ring-line transition-transform ${dragOver ? "-translate-y-1" : ""}`}>
                                    <CloudUpload size={22} />
                                </div>
                                <p className="text-sm font-semibold text-ink">
                                    File yahan drop karein ya <span className="text-primary underline-offset-2 hover:underline">browse karein</span>
                                </p>
                                <p className="text-xs text-ink/50">JPG, PNG, WebP ya PDF · max {MAX_MB} MB</p>
                                <input ref={fileRef} type="file" accept={ACCEPT} onChange={pickFile} className="hidden" />
                            </label>
                        ) : (
                            <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-secondary/20 p-3.5">
                                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-primary-dark ring-1 ring-line">
                                    <FileIcon size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                                    <p className="text-xs text-ink/55">{formatBytes(file.size)} · upload ke liye tayyar</p>
                                </div>
                                <button type="button" onClick={clearFile} className={iconBtn} aria-label="File hatayein" title="File hatayein">
                                    <X size={15} />
                                </button>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Title"
                                placeholder="Masalan: CBC blood test"
                                maxLength={100}
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                            <Field
                                as="select"
                                label="Category"
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                            >
                                {CATEGORIES.map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </Field>
                        </div>

                        <label className="block">
                            <span className="mb-1.5 flex items-center justify-between text-sm font-medium">
                                <span>
                                    Notes <span className="font-normal text-ink/45">(optional)</span>
                                </span>
                                <span className="text-xs font-normal text-ink/40">{form.notes.length}/500</span>
                            </span>
                            <textarea
                                rows={2}
                                maxLength={500}
                                placeholder="Koi zaroori baat jo doctor ko pata honi chahiye…"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                className="w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-4 focus:ring-secondary/60"
                            />
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-line bg-page/40 px-6 py-4">
                        {(file || form.title || form.notes) && !uploading && (
                            <button
                                type="button"
                                onClick={() => {
                                    setForm(initial);
                                    clearFile();
                                }}
                                className={`rounded-xl px-4 py-2.5 text-sm font-medium text-ink/60 transition hover:bg-white hover:text-ink ${focusRing}`}
                            >
                                Reset
                            </button>
                        )}
                        <button
                            disabled={uploading || !file}
                            className={`inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all hover:bg-primary-dark hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${focusRing}`}
                        >
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            {uploading ? "Uploading…" : "Upload"}
                        </button>
                    </div>
                </form>
            )}

            {/* ---------- list ---------- */}
            {!items ? (
                <SkeletonList />
            ) : items.length === 0 ? (
                <EmptyState icon={FolderOpen} title="Abhi koi report nahi" text="Upload ki hui reports yahan nazar aayengi." />
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-ink">
                            Reports <span className="ml-1 rounded-full bg-page px-2 py-0.5 text-xs text-ink/60">{items.length}</span>
                        </h3>

                        <div className="flex flex-wrap gap-1.5 rounded-xl bg-page p-1">
                            {[["all", "Sab"], ...CATEGORIES].map(([k, v]) => {
                                const active = filter === k;
                                const n = counts[k] || 0;
                                if (k !== "all" && n === 0) return null;
                                return (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => setFilter(k)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${focusRing} ${active ? "bg-white text-primary-dark shadow-sm" : "text-ink/60 hover:text-ink"
                                            }`}
                                    >
                                        {v} <span className={active ? "text-primary" : "text-ink/40"}>{n}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {visible.map((r) => (
                            <ReportRow
                                key={r._id}
                                r={r}
                                canDelete={canDelete(r)}
                                onView={() => setViewing(r)}
                                onDelete={() => setTarget(r)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ---------- delete confirm ---------- */}
            {target && (
                <Modal title="Report hata dein?" onClose={() => !deleting && setTarget(null)}>
                    <div className="flex gap-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-500">
                            <AlertTriangle size={20} />
                        </div>
                        <p className="text-sm leading-relaxed text-ink/70">
                            <span className="font-semibold text-ink">{target.title}</span> hamesha ke liye hat jayegi. Ye kaam wapis nahi ho sakta.
                        </p>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setTarget(null)}
                            disabled={deleting}
                            className={`rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page disabled:opacity-60 ${focusRing}`}
                        >
                            Wapis
                        </button>
                        <button
                            onClick={remove}
                            disabled={deleting}
                            className={`inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-600 active:scale-[0.98] disabled:opacity-60 ${focusRing}`}
                        >
                            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            Haan, hata dein
                        </button>
                    </div>
                </Modal>
            )}

            {viewing && <ReportViewer report={viewing} onClose={() => setViewing(null)} />}
        </div>
    );
}