import { useState } from "react";
import { CalendarDays, Eye, FolderOpen, Pill, Stethoscope } from "lucide-react";
import { formatBytes, formatDate, formatShortDay, formatTime } from "../utils/format";
import StatusBadge from "./StatusBadge";
import ReportViewer from "./ReportViewer";

const META = {
    appointment: { title: "Appointment", icon: CalendarDays },
    diagnosis: { title: "Diagnosis", icon: Stethoscope },
    prescription: { title: "Prescription", icon: Pill },
    report: { title: "Report", icon: FolderOpen },
};
const CATEGORY = { lab_report: "Lab report", xray: "X-ray", scan: "Scan", other: "Other" };

const medLine = (m) => [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(" • ");

export default function TimelineList({ items }) {
    const [viewing, setViewing] = useState(null);

    return (
        <>
            <div className="relative ml-3 border-l-2 border-secondary pl-8">
                {items.map((it, i) => {
                    const { title, icon: Icon } = META[it.type] || { title: it.type, icon: Stethoscope };
                    const d = it.data || {};

                    return (
                        <div key={d._id || i} className="relative mb-5">
                            <span className="absolute -left-[41px] top-5 h-4 w-4 rounded-full border-4 border-page bg-primary" />
                            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary/60 text-primary-dark">
                                            <Icon size={16} />
                                        </div>
                                        <h3 className="font-semibold">{title}</h3>
                                        {it.type === "appointment" && d.status && <StatusBadge status={d.status} />}
                                    </div>
                                    <span className="text-xs text-ink/60">{formatDate(it.date)}</span>
                                </div>

                                {d.doctor?.name && <p className="mt-1.5 text-xs text-primary-dark">Dr. {d.doctor.name}</p>}

                                <div className="mt-3 space-y-2 text-sm text-ink/80">
                                    {it.type === "appointment" && (
                                        <>
                                            <p>
                                                {d.date ? formatShortDay(d.date) : "—"} • {formatTime(d.timeSlot)}
                                            </p>
                                            {d.reason && <p className="text-ink/60">{d.reason}</p>}
                                        </>
                                    )}

                                    {it.type === "diagnosis" && (
                                        <>
                                            <p className="font-medium text-ink">{d.diagnosis}</p>
                                            {d.symptoms && (
                                                <p>
                                                    <span className="text-ink/50">Symptoms: </span>
                                                    {Array.isArray(d.symptoms) ? d.symptoms.join(", ") : d.symptoms}
                                                </p>
                                            )}
                                            {d.notes && <p className="text-ink/60">{d.notes}</p>}
                                        </>
                                    )}

                                    {it.type === "prescription" && (
                                        <>
                                            <ul className="space-y-1.5">
                                                {(d.medicines || []).map((m, j) => (
                                                    <li key={j} className="flex items-center gap-2 rounded-lg bg-page px-3 py-2">
                                                        <Pill size={14} className="shrink-0 text-primary" />
                                                        {medLine(m)}
                                                    </li>
                                                ))}
                                            </ul>
                                            {d.notes && <p className="text-ink/60">{d.notes}</p>}
                                        </>
                                    )}

                                    {it.type === "report" && (
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-ink">{d.title}</p>
                                                <p className="text-xs text-ink/60">
                                                    {CATEGORY[d.category] || "Other"} • {formatBytes(d.file?.bytes)}
                                                    {d.uploadedBy?.name ? ` • ${d.uploadedBy.name}` : ""}
                                                </p>
                                                {d.notes && <p className="mt-1 text-ink/60">{d.notes}</p>}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setViewing(d)}
                                                className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink/70 transition hover:bg-page"
                                            >
                                                <Eye size={14} /> View
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {viewing && <ReportViewer report={viewing} onClose={() => setViewing(null)} />}
        </>
    );
}