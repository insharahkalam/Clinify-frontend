import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileText, Pill, Stethoscope } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatDate } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { Download } from "lucide-react";
import { downloadPrescriptionPdf } from "../../utils/pdf";

// Medicine string bhi ho sakti hai ya object bhi, dono handle
const medLabel = (m) => {
    if (typeof m === "string") return m;
    return [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(" • ");
};

export default function Prescriptions() {
    const [list, setList] = useState(null);

    useEffect(() => {
        api
            .get(ENDPOINTS.patient.prescriptions)
            .then(({ data }) => setList(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setList([]);
            });
    }, []);

    if (!list) return <Loader />;

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader title="Prescriptions" subtitle="Doctors ki likhi hui saari prescriptions" />

            {list.length === 0 ? (
                <EmptyState icon={FileText} title="Abhi koi prescription nahi" text="Jab doctor prescription likhega to yahan nazar aayegi." />
            ) : (
                <div className="space-y-5">
                    {list.map((rx) => (
                        <div
                            key={rx._id}
                            className="rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary/60 text-primary-dark">
                                        <Stethoscope size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Dr. {rx.doctor?.name || "—"}</p>
                                        <p className="text-xs text-ink/60">{rx.doctor?.specialization}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-page px-3 py-1 text-xs font-medium text-ink/70">
                                        {formatDate(rx.createdAt)}
                                    </span>
                                    <button
                                        onClick={() => downloadPrescriptionPdf(rx._id)}
                                        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1 text-xs font-medium text-ink/70 transition hover:bg-page"
                                    >
                                        <Download size={14} /> PDF
                                    </button>
                                </div>
                            </div>

                            {rx.diagnosis && (
                                <div className="mt-5">
                                    <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Diagnosis</p>
                                    <p className="mt-1 text-sm">{rx.diagnosis}</p>
                                </div>
                            )}

                            {Array.isArray(rx.medicines) && rx.medicines.length > 0 && (
                                <div className="mt-5">
                                    <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Medicines</p>
                                    <ul className="mt-2 space-y-2">
                                        {rx.medicines.map((m, i) => (
                                            <li key={i} className="flex items-center gap-2.5 rounded-xl bg-page px-3.5 py-2.5 text-sm">
                                                <Pill size={15} className="shrink-0 text-primary" />
                                                {medLabel(m)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(rx.notes || rx.instructions) && (
                                <div className="mt-5 border-t border-line pt-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Notes</p>
                                    <p className="mt-1 text-sm text-ink/80">{rx.notes || rx.instructions}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}