import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { formatShortDay, formatTime } from "../../utils/format";
import StatusBadge from "../../components/StatusBadge";

export default function PatientAppointments({ patientId }) {
    const [items, setItems] = useState(null);

    useEffect(() => {
        api
            .get(ENDPOINTS.appointments.byPatient(patientId))
            .then(({ data }) => setItems(data))
            .catch(() => setItems([]));
    }, [patientId]);

    return (
        <div className="mt-6 rounded-2xl border border-line bg-white p-7 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
            <h2 className="mb-4 font-semibold">Appointment history</h2>

            {!items ? (
                <p className="text-sm text-ink/60">Loading...</p>
            ) : items.length === 0 ? (
                <div className="py-6 text-center text-sm text-ink/60">
                    <CalendarDays size={22} className="mx-auto mb-2 text-primary" />
                    Abhi tak koi appointment nahi.
                </div>
            ) : (
                <ul className="divide-y divide-line">
                    {items.map((a) => (
                        <li key={a._id} className="flex flex-wrap items-center gap-x-5 gap-y-1 py-3.5">
                            <div className="w-36 shrink-0">
                                <p className="text-sm font-medium">{formatShortDay(a.date)}</p>
                                <p className="text-xs text-primary-dark">{formatTime(a.timeSlot)}</p>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm">Dr. {a.doctor?.name}</p>
                                {a.reason && <p className="truncate text-xs text-ink/60">{a.reason}</p>}
                            </div>
                            <StatusBadge status={a.status} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}