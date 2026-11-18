import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { SLOTS, formatTime, nowTime, todayStr } from "../utils/format";

// Doctor + date ke hisaab se booked slots disable dikhata hai
export default function SlotPicker({ doctorId, date, value, onChange, ignoreId }) {
    const [taken, setTaken] = useState(null);

    useEffect(() => {
        if (!doctorId || !date) {
            setTaken(null);
            return;
        }
        let stale = false;
        setTaken(null);
        api
            .get(ENDPOINTS.appointments.availability, { params: { date, doctorId } })
            .then(({ data }) => {
                if (stale) return;
                setTaken(new Set(data.filter((a) => a._id !== ignoreId).map((a) => a.timeSlot)));
            })
            .catch(() => !stale && setTaken(new Set()));
            
    }, [doctorId, date, ignoreId]);

    if (!doctorId || !date) {
        return (
            <p className="rounded-xl border border-dashed border-line bg-page/60 px-4 py-6 text-center text-sm text-ink/60">
                Pehle doctor aur date chunein
            </p>
        );
    }

    if (!taken) {
        return (
            <div className="grid place-items-center py-8 text-primary">
                <Loader2 className="animate-spin" size={22} />
            </div>
        );
    }

    const isToday = date === todayStr();
    const now = nowTime();

    return (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {SLOTS.map((s) => {
                const booked = taken.has(s);
                const past = isToday && s <= now;
                const disabled = booked || past;
                const active = value === s;

                return (
                    <button
                        key={s}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(s)}
                        className={`rounded-xl border px-2 py-2 text-sm font-medium transition ${active
                            ? "border-primary bg-primary text-white shadow-md shadow-primary/30"
                            : disabled
                                ? "cursor-not-allowed border-line bg-page text-ink/30 line-through"
                                : "border-line bg-white text-ink hover:border-primary hover:bg-secondary/40"
                            }`}
                    >
                        {formatTime(s)}
                    </button>
                );
            })}
        </div>
    );
}