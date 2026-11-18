import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, FilePlus2, ShieldAlert } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg } from "../../utils/format";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import TimelineList from "../../components/TimelineList";
import RiskPanel from "../../components/RiskPanel";
import ReportsPanel from "../../components/ReportsPanel";

const card = "rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]";

export default function DoctorPatientDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setData(null);
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
                <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-primary-dark">
                    <ArrowLeft size={16} /> Back to patients
                </Link>
                <EmptyState icon={ShieldAlert} title="Patient ka record nahi khul saka" text="Sirf wo patients dikhte hain jin ki aap ke saath appointment ho." />
            </div>
        );
    }
    if (!data) return <Loader />;

    const { patient, timeline } = data;
    const info = [
        ["Email", patient.user?.email],
        ["Phone", patient.user?.phone],
        ["Age", patient.age],
        ["Gender", patient.gender],
        ["Blood group", patient.bloodGroup],
        ["Address", patient.address],
    ];

    return (
        <div className="mx-auto max-w-4xl">
            <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-primary-dark">
                <ArrowLeft size={16} /> Back to patients
            </Link>

            <div className={card}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-2xl font-semibold text-primary-dark">
                            {patient.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{patient.user?.name}</h1>
                            <p className="text-sm text-ink/60">Patient</p>
                        </div>
                    </div>
                    <Link
                        to={`/prescriptions/new?patient=${patient._id}`}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark"
                    >
                        <FilePlus2 size={15} /> Diagnosis / Prescription
                    </Link>
                </div>

                <div className="my-6 border-t border-line" />

                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                    {info.map(([label, value]) => (
                        <div key={label}>
                            <dt className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</dt>
                            <dd className="mt-1 text-sm capitalize">{value || "—"}</dd>
                        </div>
                    ))}
                </dl>

                {patient.medicalNotes && (
                    <div className="mt-6 rounded-xl bg-page p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Medical notes</p>
                        <p className="mt-1 text-sm">{patient.medicalNotes}</p>
                    </div>
                )}
            </div>

            <RiskPanel patientId={patient._id} />

            <h2 className="mb-4 mt-8 font-semibold">Reports</h2>
            <ReportsPanel patientId={patient._id} />

            <h2 className="mb-4 mt-8 font-semibold">Medical history</h2>
            {timeline.length === 0 ? (
                <EmptyState title="Abhi koi history nahi" text="Appointments, diagnosis, prescriptions aur reports yahan nazar aayengi." />
            ) : (
                <TimelineList items={timeline} />
            )}
        </div>
    );
}