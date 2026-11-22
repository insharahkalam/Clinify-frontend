import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    AlertTriangle,
    ArrowDownUp,
    Bone,
    CalendarDays,
    Check,
    ChevronDown,
    CloudUpload,
    Download,
    Eye,
    FileText,
    FlaskConical,
    FolderOpen,
    HardDrive,
    Image as ImageIcon,
    LayoutGrid,
    List,
    Loader2,
    RefreshCw,
    ScanLine,
    Search,
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
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "pdf"];
const NOTES_MAX = 500;
const CATEGORIES = [
    ["lab_report", "Lab report"],
    ["xray", "X-ray"],
    ["scan", "Scan"],
    ["other", "Other"],
];
const CAT_ICON = { lab_report: FlaskConical, xray: Bone, scan: ScanLine, other: FileText };
const SORTS = [
    ["newest", "Naye pehle"],
    ["oldest", "Purane pehle"],
    ["name", "Naam (A–Z)"],
    ["size", "Bari file pehle"],
];
const VIEW_KEY = "reports:view";
const label = (c) => CATEGORIES.find(([k]) => k === c)?.[1] || "Other";
const initial = { title: "", category: "lab_report", notes: "" };

/* ---------- shared styles ---------- */
const card = "rounded-2xl border border-line bg-white shadow-[0_4px_20px_rgba(169,155,203,0.10)]";
const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const iconBtn = `grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-ink/60 transition-all hover:border-primary/40 hover:bg-page hover:text-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

const isTyping = (el) =>
    el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);

/* ---------- small pieces ---------- */
function SkeletonList({ layout = "list" }) {
    if (layout === "grid") {
        return (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className={`${card} animate-pulse space-y-3 p-4`}>
                        <div className="h-12 w-12 rounded-xl bg-page" />
                        <div className="h-3.5 w-2/3 rounded bg-page" />
                        <div className="h-3 w-1/2 rounded bg-page" />
                        <div className="h-9 w-full rounded-xl bg-page" />
                    </div>
                ))}
            </div>
        );
    }
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

/** Highlights the part of `text` that matches the search query. */
function Highlight({ text = "", query }) {
    const q = query.trim();
    if (!q) return text;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i === -1) return text;
    return (
        <>
            {text.slice(0, i)}
            <mark className="rounded bg-secondary px-0.5 text-ink">{text.slice(i, i + q.length)}</mark>
            {text.slice(i + q.length)}
        </>
    );
}

function ReportRow({ r, layout, query, fresh, canDelete, downloading, onView, onDownload, onDelete }) {
    const [notesOpen, setNotesOpen] = useState(false);
    const isPdf = r.file?.format === "pdf";
    const Icon = isPdf ? FileText : ImageIcon;
    const longNotes = (r.notes?.length || 0) > 80;
    const grid = layout === "grid";

    const onKeyDown = (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView();
        }
        if ((e.key === "Delete" || e.key === "Backspace") && canDelete) {
            e.preventDefault();
            onDelete();
        }
    };

    return (
        <div
            tabIndex={0}
            onKeyDown={onKeyDown}
            onDoubleClick={onView}
            className={`${card} group relative transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_28px_rgba(169,155,203,0.18)] ${focusRing} ${fresh ? "ring-2 ring-primary/50 ring-offset-2" : ""
                } ${grid ? "flex flex-col gap-3 p-4" : "flex flex-wrap items-center gap-x-5 gap-y-3 p-4"}`}
        >
            {fresh && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                    Nayi
                </span>
            )}

            <button
                type="button"
                onClick={onView}
                tabIndex={-1}
                className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-secondary to-secondary/40 text-primary-dark transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3"
                aria-label={`${r.title} dekhein`}
            >
                <Icon size={20} />
                <span className="absolute -bottom-1.5 rounded-md bg-white px-1.5 text-[9px] font-bold uppercase tracking-wide text-primary-dark ring-1 ring-line">
                    {isPdf ? "PDF" : "IMG"}
                </span>
            </button>

            <div className={`min-w-0 ${grid ? "flex-1" : "flex-1 basis-56"}`}>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onView}
                        tabIndex={-1}
                        className="truncate text-left text-sm font-semibold text-ink transition-colors hover:text-primary-dark"
                    >
                        <Highlight text={r.title} query={query} />
                    </button>
                    <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">
                        {label(r.category)}
                    </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/55">
                    <span className="inline-flex items-center gap-1" title={r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}>
                        <CalendarDays size={12} /> {formatDate(r.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <HardDrive size={12} /> {formatBytes(r.file?.bytes)}
                    </span>
                    {r.uploadedBy?.name && (
                        <span className="inline-flex items-center gap-1">
                            <User size={12} /> <Highlight text={r.uploadedBy.name} query={query} />
                        </span>
                    )}
                </div>

                {r.notes && (
                    <div className="mt-1.5 text-xs italic text-ink/50">
                        <p className={notesOpen ? "whitespace-pre-line" : "line-clamp-1"}>
                            "<Highlight text={r.notes} query={query} />"
                        </p>
                        {longNotes && (
                            <button
                                type="button"
                                onClick={() => setNotesOpen((o) => !o)}
                                className="mt-0.5 inline-flex items-center gap-0.5 not-italic font-medium text-primary hover:text-primary-dark"
                            >
                                {notesOpen ? "Kam dekhein" : "Aur dekhein"}
                                <ChevronDown size={12} className={`transition-transform ${notesOpen ? "rotate-180" : ""}`} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className={`flex items-center gap-2 ${grid ? "border-t border-line pt-3" : ""}`}>
                <button
                    type="button"
                    onClick={onView}
                    className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md active:scale-95 ${grid ? "flex-1" : ""} ${focusRing}`}
                >
                    <Eye size={14} /> View
                </button>
                <button
                    type="button"
                    onClick={onDownload}
                    disabled={downloading}
                    className={iconBtn}
                    aria-label="Download"
                    title="Download"
                >
                    {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
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
    const searchRef = useRef(null);
    const freshTimer = useRef(null);

    const [items, setItems] = useState(null);
    const [form, setForm] = useState(initial);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [filter, setFilter] = useState("all");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("newest");
    const [layout, setLayout] = useState("list");
    const [formOpen, setFormOpen] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [freshIds, setFreshIds] = useState(() => new Set());

    /* ---------- data ---------- */
    const load = useCallback(
        () =>
            api
                .get(ENDPOINTS.reports.base, { params: patientId ? { patientId } : {} })
                .then(({ data }) => {
                    setItems(data);
                    return data;
                })
                .catch((e) => {
                    toast.error(errMsg(e));
                    setItems((prev) => prev || []);
                    return null;
                }),
        [patientId]
    );

    useEffect(() => {
        setItems(null);
        load();
    }, [load]);

    useEffect(() => () => clearTimeout(freshTimer.current), []);

    const refresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    /* ---------- remembered list / grid choice ---------- */
    useEffect(() => {
        try {
            const saved = localStorage.getItem(VIEW_KEY);
            if (saved === "grid" || saved === "list") setLayout(saved);
        } catch {
            /* storage blocked – ignore */
        }
    }, []);

    const changeLayout = (v) => {
        setLayout(v);
        try {
            localStorage.setItem(VIEW_KEY, v);
        } catch {
            /* ignore */
        }
    };

    /* ---------- file handling ---------- */
    const clearFile = () => {
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const acceptFile = (f) => {
        if (!f) return clearFile();
        const ext = f.name.split(".").pop()?.toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
            toast.error("Sirf JPG, PNG, WebP ya PDF file chalegi");
            return clearFile();
        }
        if (f.size > MAX_MB * 1024 * 1024) {
            toast.error(`File ${MAX_MB} MB se choti honi chahiye`);
            return clearFile();
        }
        setFile(f);
        setFormOpen(true);
        setForm((p) => (p.title ? p : { ...p, title: f.name.replace(/\.[^.]+$/, "").slice(0, 100) }));
    };

    const pickFile = (e) => acceptFile(e.target.files?.[0]);

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        acceptFile(e.dataTransfer.files?.[0]);
    };

    const previewUrl = useMemo(
        () => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null),
        [file]
    );
    useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

    /* paste a screenshot / image straight into the form (Ctrl + V) */
    useEffect(() => {
        if (readOnly || uploading) return;
        const onPaste = (e) => {
            const f = e.clipboardData?.files?.[0];
            if (!f) return;
            e.preventDefault();
            acceptFile(f);
            toast.success("Clipboard se file le li gayi");
        };
        window.addEventListener("paste", onPaste);
        return () => window.removeEventListener("paste", onPaste);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [readOnly, uploading]);

    /* press "/" anywhere to jump to search */
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "/" && !isTyping(document.activeElement)) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    /* ---------- actions ---------- */
    const resetForm = () => {
        setForm(initial);
        clearFile();
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

        const before = new Set((items || []).map((r) => r._id));
        setUploading(true);
        setProgress(0);
        try {
            await api.post(ENDPOINTS.reports.base, fd, {
                onUploadProgress: (ev) => {
                    if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
                },
            });
            toast.success("Report upload ho gayi");
            resetForm();
            const data = await load();
            if (data) {
                setFilter("all");
                setQuery("");
                setFreshIds(new Set(data.filter((r) => !before.has(r._id)).map((r) => r._id)));
                clearTimeout(freshTimer.current);
                freshTimer.current = setTimeout(() => setFreshIds(new Set()), 4000);
            }
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const download = async (r) => {
        setDownloadingId(r._id);
        try {
            await downloadReport(r._id, r.file?.originalName);
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setDownloadingId(null);
        }
    };

    const remove = async () => {
        setDeleting(true);
        try {
            await api.delete(ENDPOINTS.reports.remove(target._id));
            toast.success("Report hata di gayi");
            setItems((prev) => (prev || []).filter((r) => r._id !== target._id));
            setTarget(null);
            load();
        } catch (err) {
            toast.error(errMsg(err));
        } finally {
            setDeleting(false);
        }
    };

    const canDelete = (r) => user.role === "receptionist" || (r.uploadedBy?._id || r.uploadedBy) === user.id;

    /* ---------- derived ---------- */
    const counts = useMemo(() => {
        const c = { all: items?.length || 0 };
        (items || []).forEach((r) => (c[r.category] = (c[r.category] || 0) + 1));
        return c;
    }, [items]);

    useEffect(() => {
        if (filter !== "all" && !counts[filter]) setFilter("all");
    }, [counts, filter]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = items || [];
        if (filter !== "all") list = list.filter((r) => r.category === filter);
        if (q) {
            list = list.filter((r) =>
                [r.title, r.notes, label(r.category), r.uploadedBy?.name, r.file?.originalName]
                    .filter(Boolean)
                    .some((s) => String(s).toLowerCase().includes(q))
            );
        }
        const time = (r) => new Date(r.createdAt || 0).getTime();
        const sorters = {
            newest: (a, b) => time(b) - time(a),
            oldest: (a, b) => time(a) - time(b),
            name: (a, b) => (a.title || "").localeCompare(b.title || ""),
            size: (a, b) => (b.file?.bytes || 0) - (a.file?.bytes || 0),
        };
        return [...list].sort(sorters[sort]);
    }, [items, filter, query, sort]);

    const FileIcon = file?.type === "application/pdf" ? FileText : ImageIcon;
    const dirty = Boolean(file || form.title || form.notes);
    const notesNearLimit = form.notes.length > NOTES_MAX - 50;
    const filtersActive = filter !== "all" || query.trim();

    return (
        <div className="space-y-6">
            {/* ---------- upload form ---------- */}
            {!readOnly && (
                <form onSubmit={upload} className={`${card} overflow-hidden`}>
                    <button
                        type="button"
                        onClick={() => setFormOpen((o) => !o)}
                        aria-expanded={formOpen}
                        className={`flex w-full items-center gap-3 bg-page/40 px-6 py-4 text-left transition-colors hover:bg-page/70 ${formOpen ? "border-b border-line" : ""
                            } ${focusRing}`}
                    >
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-secondary to-secondary/40 text-primary-dark">
                            <Upload size={18} />
                        </div>
                        <div className="flex-1">
                            <h2 className="font-semibold text-ink">Nayi report upload karein</h2>
                            <p className="text-xs text-ink/55">
                                {formOpen
                                    ? "Drag & drop karein, browse karein ya Ctrl + V se paste karein"
                                    : dirty
                                        ? "Form mein adhoori report hai – kholne ke liye click karein"
                                        : "Kholne ke liye click karein"}
                            </p>
                        </div>
                        <ChevronDown
                            size={18}
                            className={`text-ink/50 transition-transform duration-300 ${formOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    <div
                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${formOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                    >
                        <div className="overflow-hidden">
                            <div className="space-y-5 p-6">
                                {/* dropzone */}
                                {!file ? (
                                    <label
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                fileRef.current?.click();
                                            }
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOver(true);
                                        }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={onDrop}
                                        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all ${focusRing} ${dragOver
                                            ? "scale-[1.01] border-primary bg-secondary/40"
                                            : "border-line bg-page/50 hover:border-primary/50 hover:bg-page"
                                            }`}
                                    >
                                        <div
                                            className={`grid h-12 w-12 place-items-center rounded-full bg-white text-primary shadow-sm ring-1 ring-line transition-transform duration-300 ${dragOver ? "-translate-y-1.5 scale-110" : ""
                                                }`}
                                        >
                                            <CloudUpload size={22} className={dragOver ? "animate-bounce" : ""} />
                                        </div>
                                        <p className="text-sm font-semibold text-ink">
                                            {dragOver ? (
                                                "Chhor dein, file le li jayegi"
                                            ) : (
                                                <>
                                                    File yahan drop karein ya{" "}
                                                    <span className="text-primary underline-offset-2 hover:underline">browse karein</span>
                                                </>
                                            )}
                                        </p>
                                        <p className="text-xs text-ink/50">JPG, PNG, WebP ya PDF · max {MAX_MB} MB</p>
                                        <input ref={fileRef} type="file" accept={ACCEPT} onChange={pickFile} className="hidden" />
                                    </label>
                                ) : (
                                    <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-secondary/20 p-3.5">
                                        {previewUrl ? (
                                            <a
                                                href={previewUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Poori image dekhein"
                                                className={`group/preview relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-line ${focusRing}`}
                                            >
                                                <img src={previewUrl} alt="" className="h-full w-full object-cover transition-transform group-hover/preview:scale-110" />
                                                <span className="absolute inset-0 grid place-items-center bg-ink/40 text-white opacity-0 transition-opacity group-hover/preview:opacity-100">
                                                    <Eye size={16} />
                                                </span>
                                            </a>
                                        ) : (
                                            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white text-primary-dark ring-1 ring-line">
                                                <FileIcon size={22} />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                                            <p className="text-xs text-ink/55">
                                                {formatBytes(file.size)} ·{" "}
                                                {uploading ? `${progress}% upload ho chuka` : "upload ke liye tayyar"}
                                            </p>
                                            {uploading && (
                                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-[width] duration-200"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {!uploading && (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileRef.current?.click()}
                                                    className={`hidden h-9 rounded-xl border border-line bg-white px-3 text-xs font-medium text-ink/70 transition hover:border-primary/40 hover:text-primary-dark sm:block ${focusRing}`}
                                                >
                                                    Badlein
                                                </button>
                                                <button type="button" onClick={clearFile} className={iconBtn} aria-label="File hatayein" title="File hatayein">
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        )}
                                        <input ref={fileRef} type="file" accept={ACCEPT} onChange={pickFile} className="hidden" />
                                    </div>
                                )}

                                {/* category chips */}
                                <div>
                                    <span className="mb-2 block text-sm font-medium">Category</span>
                                    <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {CATEGORIES.map(([k, v]) => {
                                            const CatIcon = CAT_ICON[k];
                                            const active = form.category === k;
                                            return (
                                                <button
                                                    key={k}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={active}
                                                    onClick={() => setForm({ ...form, category: k })}
                                                    className={`relative flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${focusRing} ${active
                                                        ? "border-primary bg-secondary/40 text-primary-dark shadow-sm"
                                                        : "border-line bg-white text-ink/65 hover:border-primary/40 hover:bg-page"
                                                        }`}
                                                >
                                                    <CatIcon size={16} className={active ? "text-primary" : "text-ink/40"} />
                                                    {v}
                                                    {active && (
                                                        <span className="ml-auto grid h-4 w-4 place-items-center rounded-full bg-primary text-white">
                                                            <Check size={10} strokeWidth={3} />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <Field
                                    label="Title"
                                    placeholder="Masalan: CBC blood test"
                                    maxLength={100}
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />

                                <label className="block">
                                    <span className="mb-1.5 flex items-center justify-between text-sm font-medium">
                                        <span>
                                            Notes <span className="font-normal text-ink/45">(optional)</span>
                                        </span>
                                        <span className={`text-xs font-normal transition-colors ${notesNearLimit ? "text-amber-600" : "text-ink/40"}`}>
                                            {form.notes.length}/{NOTES_MAX}
                                        </span>
                                    </span>
                                    <textarea
                                        rows={2}
                                        maxLength={NOTES_MAX}
                                        placeholder="Koi zaroori baat jo doctor ko pata honi chahiye…"
                                        value={form.notes}
                                        onChange={(e) => {
                                            setForm({ ...form, notes: e.target.value });
                                            e.target.style.height = "auto";
                                            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                        }}
                                        className="w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-4 focus:ring-secondary/60"
                                    />
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-line bg-page/40 px-6 py-4">
                                {dirty && !uploading && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className={`rounded-xl px-4 py-2.5 text-sm font-medium text-ink/60 transition hover:bg-white hover:text-ink ${focusRing}`}
                                    >
                                        Reset
                                    </button>
                                )}
                                <button
                                    disabled={uploading || !file}
                                    className={`relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all hover:bg-primary-dark hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${focusRing}`}
                                >
                                    {uploading && (
                                        <span
                                            className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-200"
                                            style={{ width: `${progress}%` }}
                                        />
                                    )}
                                    <span className="relative inline-flex items-center gap-2">
                                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                        {uploading ? `Uploading… ${progress}%` : "Upload"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {/* ---------- list ---------- */}
            {!items ? (
                <SkeletonList layout={layout} />
            ) : items.length === 0 ? (
                <EmptyState icon={FolderOpen} title="Abhi koi report nahi" text="Upload ki hui reports yahan nazar aayengi." />
            ) : (
                <div className="space-y-4">
                    {/* toolbar */}
                    <div className={`${card} space-y-3 p-3`}>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-0 flex-1 basis-60">
                                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                                <input
                                    ref={searchRef}
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Escape" && (setQuery(""), e.currentTarget.blur())}
                                    placeholder="Title, notes ya naam se dhoondein…"
                                    className="h-10 w-full rounded-xl border border-line bg-page/50 pl-9 pr-16 text-sm outline-none transition placeholder:text-ink/40 focus:border-primary focus:bg-white focus:ring-4 focus:ring-secondary/60 [&::-webkit-search-cancel-button]:hidden"
                                />
                                {query ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery("");
                                            searchRef.current?.focus();
                                        }}
                                        className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-ink/50 hover:bg-page hover:text-ink"
                                        aria-label="Search saaf karein"
                                    >
                                        <X size={14} />
                                    </button>
                                ) : (
                                    <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-white px-1.5 text-[10px] font-medium text-ink/40">
                                        /
                                    </kbd>
                                )}
                            </div>

                            <label className="relative">
                                <span className="sr-only">Sort</span>
                                <ArrowDownUp size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                                <select
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value)}
                                    className="h-10 cursor-pointer appearance-none rounded-xl border border-line bg-white pl-8 pr-8 text-sm text-ink/80 outline-none transition hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-secondary/60"
                                >
                                    {SORTS.map(([k, v]) => (
                                        <option key={k} value={k}>
                                            {v}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40" />
                            </label>

                            <div className="flex rounded-xl bg-page p-1" role="group" aria-label="Layout">
                                {[
                                    ["list", List, "List"],
                                    ["grid", LayoutGrid, "Grid"],
                                ].map(([k, Ico, name]) => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => changeLayout(k)}
                                        aria-pressed={layout === k}
                                        title={name}
                                        className={`grid h-8 w-8 place-items-center rounded-lg transition-all ${focusRing} ${layout === k ? "bg-white text-primary-dark shadow-sm" : "text-ink/50 hover:text-ink"
                                            }`}
                                    >
                                        <Ico size={15} />
                                    </button>
                                ))}
                            </div>

                            <button type="button" onClick={refresh} disabled={refreshing} className={iconBtn} aria-label="Refresh" title="Refresh">
                                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
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
                                            aria-pressed={active}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${focusRing} ${active ? "bg-white text-primary-dark shadow-sm" : "text-ink/60 hover:bg-white/60 hover:text-ink"
                                                }`}
                                        >
                                            {v} <span className={active ? "text-primary" : "text-ink/40"}>{n}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="text-xs text-ink/50">
                                {visible.length} / {items.length} reports
                                {filtersActive && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilter("all");
                                            setQuery("");
                                        }}
                                        className="ml-2 font-medium text-primary hover:text-primary-dark"
                                    >
                                        Filters hatayein
                                    </button>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* results */}
                    {visible.length === 0 ? (
                        <div className={`${card} flex flex-col items-center gap-2 px-6 py-10 text-center`}>
                            <div className="grid h-12 w-12 place-items-center rounded-full bg-page text-ink/40">
                                <Search size={20} />
                            </div>
                            <p className="text-sm font-semibold text-ink">Koi report nahi mili</p>
                            <p className="text-xs text-ink/55">
                                {query.trim() ? <>"{query.trim()}" se milti koi report nahi.</> : "Is category mein koi report nahi."}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setFilter("all");
                                    setQuery("");
                                }}
                                className={`mt-2 rounded-xl border border-line px-4 py-2 text-xs font-medium text-ink/70 transition hover:bg-page ${focusRing}`}
                            >
                                Sab reports dikhayein
                            </button>
                        </div>
                    ) : (
                        <div className={layout === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
                            {visible.map((r) => (
                                <ReportRow
                                    key={r._id}
                                    r={r}
                                    layout={layout}
                                    query={query}
                                    fresh={freshIds.has(r._id)}
                                    canDelete={canDelete(r)}
                                    downloading={downloadingId === r._id}
                                    onView={() => setViewing(r)}
                                    onDownload={() => download(r)}
                                    onDelete={() => setTarget(r)}
                                />
                            ))}
                        </div>
                    )}

                    <p className="hidden text-center text-[11px] text-ink/40 sm:block">
                        Tip: report par Enter ya double-click se kholein · "/" se search · Ctrl + V se file paste karein
                    </p>
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
                            autoFocus
                            onClick={remove}
                            disabled={deleting}
                            className={`inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-600 active:scale-[0.98] disabled:opacity-60 ${focusRing}`}
                        >
                            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            {deleting ? "Hata rahe hain…" : "Haan, hata dein"}
                        </button>
                    </div>
                </Modal>
            )}

            {viewing && <ReportViewer report={viewing} onClose={() => setViewing(null)} />}
        </div>
    );
}