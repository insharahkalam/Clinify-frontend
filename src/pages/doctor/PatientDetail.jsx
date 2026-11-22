// import { useEffect, useState } from "react";
// import { Link, useParams } from "react-router-dom";
// import toast from "react-hot-toast";
// import { ArrowLeft, FilePlus2, ShieldAlert } from "lucide-react";
// import api from "../../api/axios";
// import { ENDPOINTS } from "../../api/endpoints";
// import { errMsg } from "../../utils/format";
// import Loader from "../../components/Loader";
// import EmptyState from "../../components/EmptyState";
// import TimelineList from "../../components/TimelineList";
// import RiskPanel from "../../components/RiskPanel";
// import ReportsPanel from "../../components/ReportsPanel";

// const card = "rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]";

// export default function DoctorPatientDetail() {
//     const { id } = useParams();
//     const [data, setData] = useState(null);
//     const [failed, setFailed] = useState(false);

//     useEffect(() => {
//         setData(null);
//         api
//             .get(ENDPOINTS.doctor.patient(id))
//             .then(({ data }) => setData(data))
//             .catch((e) => {
//                 toast.error(errMsg(e));
//                 setFailed(true);
//             });
//     }, [id]);

//     if (failed) {
//         return (
//             <div className="mx-auto max-w-3xl">
//                 <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-primary-dark">
//                     <ArrowLeft size={16} /> Back to patients
//                 </Link>
//                 <EmptyState icon={ShieldAlert} title="Patient ka record nahi khul saka" text="Sirf wo patients dikhte hain jin ki aap ke saath appointment ho." />
//             </div>
//         );
//     }
//     if (!data) return <Loader />;

//     const { patient, timeline } = data;
//     const info = [
//         ["Email", patient.user?.email],
//         ["Phone", patient.user?.phone],
//         ["Age", patient.age],
//         ["Gender", patient.gender],
//         ["Blood group", patient.bloodGroup],
//         ["Address", patient.address],
//     ];

//     return (
//         <div className="mx-auto max-w-4xl">
//             <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-primary-dark">
//                 <ArrowLeft size={16} /> Back to patients
//             </Link>

//             <div className={card}>
//                 <div className="flex flex-wrap items-center justify-between gap-4">
//                     <div className="flex items-center gap-4">
//                         <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-2xl font-semibold text-primary-dark">
//                             {patient.user?.name?.[0]?.toUpperCase()}
//                         </div>
//                         <div>
//                             <h1 className="text-xl font-bold">{patient.user?.name}</h1>
//                             <p className="text-sm text-ink/60">Patient</p>
//                         </div>
//                     </div>
//                     <Link
//                         to={`/prescriptions/new?patient=${patient._id}`}
//                         className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark"
//                     >
//                         <FilePlus2 size={15} /> Diagnosis / Prescription
//                     </Link>
//                 </div>

//                 <div className="my-6 border-t border-line" />

//                 <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
//                     {info.map(([label, value]) => (
//                         <div key={label}>
//                             <dt className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</dt>
//                             <dd className="mt-1 text-sm capitalize">{value || "—"}</dd>
//                         </div>
//                     ))}
//                 </dl>

//                 {patient.medicalNotes && (
//                     <div className="mt-6 rounded-xl bg-page p-4">
//                         <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Medical notes</p>
//                         <p className="mt-1 text-sm">{patient.medicalNotes}</p>
//                     </div>
//                 )}
//             </div>

//             <RiskPanel patientId={patient._id} />

//             <h2 className="mb-4 mt-8 font-semibold">Reports</h2>
//             <ReportsPanel patientId={patient._id} readOnly />

//             <h2 className="mb-4 mt-8 font-semibold">Medical history</h2>
//             {timeline.length === 0 ? (
//                 <EmptyState title="Abhi koi history nahi" text="Appointments, diagnosis, prescriptions aur reports yahan nazar aayengi." />
//             ) : (
//                 <TimelineList items={timeline} />
//             )}
//         </div>
//     );
// }

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Activity,
    ArrowLeft,
    Check,
    Copy,
    Droplet,
    FilePlus2,
    FileText,
    History,
    Mail,
    MapPin,
    Phone,
    ShieldAlert,
    StickyNote,
} from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg } from "../../utils/format";
import TimelineList from "../../components/TimelineList";
import RiskPanel from "../../components/RiskPanel";
import ReportsPanel from "../../components/ReportsPanel";

/* ------------------------------------------------------------------ */
/*  Theme helpers (MediSync tokens)                                    */
/* ------------------------------------------------------------------ */
const focusRing = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25";
const delay = (ms) => ({ animationDelay: `${ms}ms` });
const card = "rounded-2xl border border-line-light bg-card shadow-card";

function initials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

const TABS = [
    { id: "history", label: "History", icon: History },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "risk", label: "Risk", icon: Activity },
];

/* ------------------------------------------------------------------ */
/*  Small components                                                   */
/* ------------------------------------------------------------------ */
function BackLink() {
    return (
        <Link
            to="/patients"
            className={`group mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-ink-secondary transition hover:text-lavender-deep ${focusRing}`}
        >
            <ArrowLeft size={16} className="transition group-hover:-translate-x-1" /> Back to patients
        </Link>
    );
}

function Skeleton() {
    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-5 h-5 w-36 animate-pulse rounded bg-lavender-light/70" />
            <div className="h-44 animate-pulse rounded-3xl bg-lavender-light/60" />
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <div className="h-12 animate-pulse rounded-xl bg-lavender-light/50" />
                    <div className="h-64 animate-pulse rounded-2xl bg-lavender-light/40" />
                </div>
                <div className="h-64 animate-pulse rounded-2xl bg-lavender-light/50" />
            </div>
        </div>
    );
}

function ContactRow({ icon: Icon, label, value, copyable }) {
    const [copied, setCopied] = useState(false);
    const empty = !value;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);
            toast.success(`${label} copied`);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            toast.error("Could not copy");
        }
    };

    return (
        <div className="group flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-lavender-soft/70">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lavender-light text-lavender-deep">
                <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
                <p className="break-words text-sm font-medium text-ink">{empty ? "—" : value}</p>
            </div>
            {copyable && !empty && (
                <button
                    onClick={copy}
                    aria-label={`Copy ${label}`}
                    className={`shrink-0 rounded-md p-1.5 text-ink-muted opacity-0 transition hover:bg-lavender-light hover:text-lavender-deep group-hover:opacity-100 focus-visible:opacity-100 ${focusRing}`}
                >
                    {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </button>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function DoctorPatientDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [failed, setFailed] = useState(false);
    const [tab, setTab] = useState("history");

    useEffect(() => {
        setData(null);
        setFailed(false);
        setTab("history");
        api
            .get(ENDPOINTS.doctor.patient(id))
            .then(({ data }) => setData(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setFailed(true);
            });
    }, [id]);

    if (failed) {
        return (
            <div className="mx-auto max-w-3xl">
                <BackLink />
                <div className="animate-fade-up flex flex-col items-center gap-3 rounded-2xl border border-dashed border-lavender-medium bg-section px-6 py-16 text-center">
                    <div className="animate-float flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-bg text-danger">
                        <ShieldAlert size={28} />
                    </div>
                    <h3 className="font-semibold text-ink">Could not open this patient's record</h3>
                    <p className="max-w-sm text-sm text-ink-secondary">
                        You can only view patients who have had an appointment with you.
                    </p>
                </div>
            </div>
        );
    }
    if (!data) return <Skeleton />;

    const { patient, timeline } = data;
    const name = patient.user?.name;

    const chips = [
        { label: "Age", value: patient.age },
        { label: "Gender", value: patient.gender },
        { label: "Blood", value: patient.bloodGroup },
    ];

    return (
        <div className="mx-auto max-w-6xl">
            <div className="animate-fade-up">
                <BackLink />
            </div>

            {/* ---------- Header (everything sits above the decorative blobs) ---------- */}
            <section
                className="animate-fade-up relative overflow-hidden rounded-3xl bg-ai-gradient p-6 text-white shadow-card sm:p-8"
                style={delay(60)}
            >
                <div className="animate-blob pointer-events-none absolute -right-10 -top-12 h-52 w-52 rounded-full bg-white/20 blur-2xl" />
                <div
                    className="animate-blob pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-lavender-light/30 blur-2xl"
                    style={delay(2500)}
                />

                <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex min-w-0 items-center gap-5">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold shadow-hover ring-1 ring-white/50 backdrop-blur-sm sm:h-24 sm:w-24 sm:text-3xl">
                            {initials(name)}
                        </div>

                        <div className="min-w-0">
                            <h1 className="truncate text-2xl font-bold sm:text-3xl">{name}</h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                                <span className="rounded-full bg-white/20 px-3 py-1 ring-1 ring-white/30">Patient</span>
                                {patient.bloodGroup && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 ring-1 ring-white/30">
                                        <Droplet size={11} /> {patient.bloodGroup}
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2.5">
                                {chips.map((c) => (
                                    <div
                                        key={c.label}
                                        className="min-w-[4.5rem] rounded-xl bg-white/15 px-4 py-2 ring-1 ring-white/30 backdrop-blur-sm"
                                    >
                                        <p className="text-[11px] font-medium uppercase tracking-wider text-white/75">
                                            {c.label}
                                        </p>
                                        <p className="text-base font-bold capitalize leading-tight">{c.value || "—"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Link
                        to={`/prescriptions/new?patient=${patient._id}`}
                        className={`inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ai-primary shadow-md transition hover:-translate-y-0.5 hover:shadow-hover active:translate-y-0 ${focusRing}`}
                    >
                        <FilePlus2 size={16} /> Diagnosis / Prescription
                    </Link>
                </div>
            </section>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
                {/* ---------- Main: tabs + content ---------- */}
                <main className="animate-fade-up min-w-0 lg:col-span-2" style={delay(140)}>
                    <div className="mb-5 flex gap-1 border-b border-line" role="tablist">
                        {TABS.map(({ id: tid, label, icon: Icon }) => {
                            const active = tab === tid;
                            return (
                                <button
                                    key={tid}
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setTab(tid)}
                                    className={`-mb-px flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition ${focusRing} ${active
                                            ? "border-primary text-lavender-deep"
                                            : "border-transparent text-ink-secondary hover:border-lavender-medium hover:text-ink"
                                        }`}
                                >
                                    <Icon size={16} />
                                    {label}
                                    {tid === "history" && (
                                        <span
                                            className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-lavender-light text-lavender-deep" : "bg-section text-ink-muted"
                                                }`}
                                        >
                                            {timeline.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div key={tab} className="animate-fade-up" role="tabpanel">
                        {tab === "history" &&
                            (timeline.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-lavender-medium bg-section px-6 py-14 text-center">
                                    <div className="animate-float flex h-16 w-16 items-center justify-center rounded-2xl bg-lavender-light text-lavender-deep">
                                        <History size={28} />
                                    </div>
                                    <h3 className="font-semibold text-ink">No history yet</h3>
                                    <p className="max-w-xs text-sm text-ink-secondary">
                                        Appointments, diagnoses, prescriptions and reports will appear here.
                                    </p>
                                </div>
                            ) : (
                                <TimelineList items={timeline} />
                            ))}

                        {tab === "reports" && <ReportsPanel patientId={patient._id} readOnly />}

                        {tab === "risk" && <RiskPanel patientId={patient._id} />}
                    </div>
                </main>

                {/* ---------- Side: contact + notes ---------- */}
                <aside className="animate-fade-up space-y-5 lg:sticky lg:top-6" style={delay(220)}>
                    <div className={`${card} p-3`}>
                        <h2 className="px-3 pb-1 pt-2 text-sm font-semibold text-ink">Contact details</h2>
                        <ContactRow icon={Mail} label="Email" value={patient.user?.email} copyable />
                        <ContactRow icon={Phone} label="Phone" value={patient.user?.phone} copyable />
                        <ContactRow icon={MapPin} label="Address" value={patient.address} copyable />
                    </div>

                    {patient.medicalNotes && (
                        <div className="flex gap-3 rounded-2xl border border-warning/30 bg-warning-bg p-4">
                            <StickyNote size={18} className="mt-0.5 shrink-0 text-warning" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-warning">
                                    Medical notes
                                </p>
                                <p className="mt-1 text-sm text-ink">{patient.medicalNotes}</p>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}