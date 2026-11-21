import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
    CalendarDays,
    Clock,
    Download,
    FileText,
    Pill,
    Search,
    Sparkles,
    Stethoscope,
    StickyNote,
    Timer,
} from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatDate } from "../../utils/format";
import { downloadPrescriptionPdf } from "../../utils/pdf";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import ExplainModal from "../../components/ExplainModal";

/* ---------- shared styles ---------- */
const btnBase =
    "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed";
const btnPrimary = `${btnBase} bg-primary text-white shadow-sm hover:bg-primary-dark hover:shadow-md active:scale-[0.97]`;
const btnGhost = `${btnBase} border border-line bg-white text-ink/70 hover:border-primary/40 hover:text-primary-dark hover:bg-page active:scale-[0.97]`;

/* ---------- small pieces ---------- */
function Chip({ icon: Icon, children }) {
    if (!children) return null;
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink/70 ring-1 ring-line">
            <Icon size={12} className="text-primary" />
            {children}
        </span>
    );
}

function MedicineRow({ med, index }) {
    return (
        <li className="group flex items-start gap-3 rounded-xl bg-page/70 p-3.5 transition-colors hover:bg-page">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-primary ring-1 ring-line transition-transform group-hover:scale-105">
                <Pill size={15} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-semibold text-ink/40">{String(index + 1).padStart(2, "0")}</span>
                    <p className="truncate text-sm font-semibold text-ink">{med.name || "Unnamed medicine"}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip icon={Pill}>{med.dosage}</Chip>
                    <Chip icon={Clock}>{med.frequency}</Chip>
                    <Chip icon={Timer}>{med.duration}</Chip>
                </div>
            </div>
        </li>
    );
}

function PrescriptionCard({ rx, onExplain }) {
    const [downloading, setDownloading] = useState(false);
    const medicines = rx.medicines || [];
    const doctorName = rx.doctor?.name || "—";
    const initials = doctorName
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const handleDownload = async () => {
        try {
            setDownloading(true);
            await downloadPrescriptionPdf(rx._id);
        } catch (e) {
            toast.error(errMsg(e));
        } finally {
            setDownloading(false);
        }
    };

    return (
        <article className="group relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_4px_20px_rgba(169,155,203,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(169,155,203,0.20)]">
            {/* accent bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary/40" />

            {/* header */}
            <header className="flex flex-wrap items-start justify-between gap-4 p-6 pb-4">
                <div className="flex items-center gap-3.5">
                    <div className="relative">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-secondary/40 text-sm font-bold text-primary-dark">
                            {initials || <Stethoscope size={20} />}
                        </div>
                        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white text-primary ring-2 ring-white">
                            <Stethoscope size={12} />
                        </span>
                    </div>
                    <div>
                        <p className="text-base font-semibold text-ink">Dr. {doctorName}</p>
                        <p className="text-xs text-ink/60">{rx.doctor?.specialization || "General Physician"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full bg-page px-3 py-1.5 text-xs font-medium text-ink/70">
                    <CalendarDays size={13} className="text-primary" />
                    {formatDate(rx.createdAt)}
                </div>
            </header>

            {/* medicines */}
            <section className="px-6">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/50">Medicines</h3>
                    <span className="rounded-full bg-secondary/50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-dark">
                        {medicines.length} {medicines.length === 1 ? "item" : "items"}
                    </span>
                </div>

                {medicines.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-ink/50">
                        Is prescription mein koi medicine nahi.
                    </p>
                ) : (
                    <ul className="grid gap-2.5 sm:grid-cols-2">
                        {medicines.map((m, i) => (
                            <MedicineRow key={i} med={m} index={i} />
                        ))}
                    </ul>
                )}
            </section>

            {/* notes */}
            {rx.notes && (
                <section className="mx-6 mt-4 flex gap-3 rounded-xl border-l-4 border-primary/60 bg-secondary/20 p-4">
                    <StickyNote size={16} className="mt-0.5 shrink-0 text-primary" />
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Doctor ke notes</p>
                        <p className="mt-1 text-sm leading-relaxed text-ink/80">{rx.notes}</p>
                    </div>
                </section>
            )}

            {/* footer actions */}
            <footer className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-page/40 px-6 py-3.5">
                <button onClick={handleDownload} disabled={downloading} className={btnGhost}>
                    <Download size={14} className={downloading ? "animate-bounce" : ""} />
                    {downloading ? "Downloading…" : "PDF"}
                </button>
                <button onClick={() => onExplain(rx)} className={btnPrimary}>
                    <Sparkles size={14} /> Samjhein
                </button>
            </footer>
        </article>
    );
}

/* ---------- page ---------- */
export default function Prescriptions() {
    const [list, setList] = useState(null);
    const [explain, setExplain] = useState(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        api
            .get(ENDPOINTS.patient.prescriptions)
            .then(({ data }) => setList(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setList([]);
            });
    }, []);

    const filtered = useMemo(() => {
        if (!list) return [];
        const q = query.trim().toLowerCase();
        if (!q) return list;
        return list.filter((rx) =>
            [rx.doctor?.name, rx.doctor?.specialization, rx.notes, ...(rx.medicines || []).map((m) => m.name)]
                .filter(Boolean)
                .some((v) => v.toLowerCase().includes(q))
        );
    }, [list, query]);

    const totalMeds = useMemo(
        () => (list || []).reduce((sum, rx) => sum + (rx.medicines?.length || 0), 0),
        [list]
    );

    if (!list) return <Loader />;

    return (
        <div className="mx-auto max-w-4xl px-1 pb-10">
            <PageHeader title="Prescriptions" subtitle="Doctors ki likhi hui saari prescriptions" />

            {list.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Abhi koi prescription nahi"
                    text="Jab doctor prescription likhega to yahan nazar aayegi."
                />
            ) : (
                <>
                    {/* summary + search */}
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-3">
                            <div className="rounded-2xl border border-line bg-white px-4 py-2.5">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-ink/50">Prescriptions</p>
                                <p className="text-lg font-bold text-ink">{list.length}</p>
                            </div>
                            <div className="rounded-2xl border border-line bg-white px-4 py-2.5">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-ink/50">Medicines</p>
                                <p className="text-lg font-bold text-ink">{totalMeds}</p>
                            </div>
                        </div>

                        <label className="relative w-full sm:w-72">
                            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Doctor ya medicine search karein…"
                                className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-ink/40 transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </label>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-line bg-white py-12 text-center">
                            <Search size={28} className="mx-auto text-ink/30" />
                            <p className="mt-3 text-sm font-medium text-ink/70">"{query}" se koi prescription nahi mili</p>
                            <button onClick={() => setQuery("")} className="mt-3 text-xs font-semibold text-primary hover:underline">
                                Search clear karein
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {filtered.map((rx) => (
                                <PrescriptionCard key={rx._id} rx={rx} onExplain={setExplain} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {explain && <ExplainModal prescription={explain} onClose={() => setExplain(null)} />}
        </div>
    );
}