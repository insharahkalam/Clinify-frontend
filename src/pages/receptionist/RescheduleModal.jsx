import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatTime, todayStr } from "../../utils/format";
import Modal from "../../components/Modal";
import Field from "../../components/Field";
import SlotPicker from "../../components/SlotPicker";

export default function RescheduleModal({ appointment, onClose, onDone }) {
    const [date, setDate] = useState(appointment.date);
    const [slot, setSlot] = useState("");
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!slot) return toast.error("Naya time slot chunein");
        setSaving(true);
        try {
            await api.put(ENDPOINTS.appointments.reschedule(appointment._id), { date, timeSlot: slot });
            toast.success("Appointment reschedule ho gayi");
            onDone();
        } catch (e) {
            toast.error(errMsg(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Reschedule appointment" onClose={onClose}>
            <p className="mb-5 text-sm text-ink/70">
                <span className="font-medium text-ink">{appointment.patient?.user?.name}</span> · Dr. {appointment.doctor?.name}
                <br />
                Abhi: {appointment.date} at {formatTime(appointment.timeSlot)}
            </p>

            <Field
                label="Nayi date"
                type="date"
                min={todayStr()}
                value={date}
                onChange={(e) => {
                    setDate(e.target.value);
                    setSlot("");
                }}
            />

            <p className="mb-2 mt-5 text-sm font-medium">Naya time</p>
            <SlotPicker
                doctorId={appointment.doctor?._id}
                date={date}
                value={slot}
                onChange={setSlot}
                ignoreId={appointment._id}
            />

            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page">
                    Cancel
                </button>
                <button
                    onClick={submit}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60"
                >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Save
                </button>
            </div>
        </Modal>
    );
}