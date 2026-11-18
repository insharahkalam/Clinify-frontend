import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Download, FilePlus2, FileText, Pill } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatDate } from "../../utils/format";
import { downloadPrescriptionPdf } from "../../utils/pdf";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";

const medLine = (m) => [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(" • ");

export default function DoctorPrescriptions() {
    const [list, setList] = useState(null);

    useEffect(() => {
        api
            .get(ENDPOINTS.doctor.prescriptions)
            .then(({ data }) => setList(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setList([]);
            });
    }, []);

    if (!list) return <Loader />;

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader
                title="Prescriptions"
                subtitle="Aap ki likhi hui saari prescriptions"
                action={
                    <Link
                        to="/prescriptions/new"
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark"
                    >
                        <FilePlus2 size={16} /> Nayi likhein
                    </Link>
                }
            />

            {list.length === 0 ? (
                <EmptyState icon={FileText} title="Abhi koi prescription nahi" text="Consultation ke baad likhi gayi prescriptions yahan jama hongi." />
            ) : (
                <div className="space-y-5">
                    {list.map((rx) => (
                        <div key={rx._id} className="rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-semibold text-primary-dark">
                                        {rx.patient?.user?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        {rx.patient?._id ? (
                                            <Link to={`/patients/${rx.patient._id}`} className="font-semibold hover:text-primary-dark hover:underline">
                                                {rx.patient?.user?.name || "—"}
                                            </Link>
                                        ) : (
                                            <p className="font-semibold">—</p>
                                        )}
                                        <p className="text-xs text-ink/60">{formatDate(rx.createdAt)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => downloadPrescriptionPdf(rx._id)}
                                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink/70 transition hover:bg-page"
                                >
                                    <Download size={14} /> PDF
                                </button>
                            </div>

                            <ul className="mt-4 space-y-2">
                                {(rx.medicines || []).map((m, i) => (
                                    <li key={i} className="flex items-center gap-2.5 rounded-xl bg-page px-3.5 py-2.5 text-sm">
                                        <Pill size={15} className="shrink-0 text-primary" />
                                        {medLine(m)}
                                    </li>
                                ))}
                            </ul>

                            {rx.notes && <p className="mt-4 border-t border-line pt-3 text-sm text-ink/70">{rx.notes}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}