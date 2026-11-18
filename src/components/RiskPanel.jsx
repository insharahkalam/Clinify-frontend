import { useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { errMsg, isLocked } from "../utils/format";
import LockedCard from "./LockedCard";

const LEVEL = {
    high: { badge: "bg-red-50 text-red-600", item: "bg-red-50 text-red-700", label: "Zyada khatra" },
    medium: { badge: "bg-amber-50 text-amber-800", item: "bg-amber-50 text-amber-800", label: "Darmiyana khatra" },
    low: { badge: "bg-secondary/70 text-primary-dark", item: "bg-page text-ink/70", label: "Kam khatra" },
};

export default function RiskPanel({ patientId }) {
    const [state, setState] = useState({ loading: false, data: null, locked: false });

    const check = async () => {
        setState({ loading: true, data: null, locked: false });
        try {
            const { data } = await api.get(ENDPOINTS.doctor.risk(patientId));
            setState({ loading: false, data, locked: false });
        } catch (e) {
            if (isLocked(e)) return setState({ loading: false, data: null, locked: true });
            toast.error(errMsg(e));
            setState({ loading: false, data: null, locked: false });
        }
    };

    if (state.locked) {
        return (
            <div className="mt-6">
                <LockedCard compact title="Risk flags Pro plan mein hain" />
            </div>
        );
    }

    const { data } = state;
    const level = LEVEL[data?.riskLevel] || LEVEL.low;

    return (
        <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/60 text-primary-dark">
                        <ShieldAlert size={18} />
                    </div>
                    <h2 className="font-semibold">Risk flags</h2>
                    {data && <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${level.badge}`}>{level.label}</span>}
                </div>
                <button
                    onClick={check}
                    disabled={state.loading}
                    className="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-page disabled:opacity-60"
                >
                    {state.loading && <Loader2 size={15} className="animate-spin" />}
                    {data ? "Dobara check karein" : "Check karein"}
                </button>
            </div>

            {data && (
                <div className="mt-5 space-y-3">
                    {data.flags.length === 0 ? (
                        <p className="flex items-center justify-center gap-2 rounded-xl bg-page px-4 py-4 text-sm text-ink/60">
                            <CheckCircle2 size={16} className="text-primary" />
                            {data.checkedDiagnoses} diagnoses check hui, koi risk flag nahi mila.
                        </p>
                    ) : (
                        data.flags.map((f, i) => {
                            const l = LEVEL[f.severity] || LEVEL.low;
                            return (
                                <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 ${l.item}`}>
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold">{f.title}</p>
                                        <p className="mt-0.5 text-xs opacity-90">{f.detail}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {data.disclaimer && <p className="text-xs text-ink/50">{data.disclaimer}</p>}
                </div>
            )}
        </div>
    );
}