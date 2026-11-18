import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Pill, Sparkles, X } from "lucide-react";
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { errMsg, isLocked } from "../utils/format";
import Field from "./Field";
import LockedCard from "./LockedCard";

const LANGS = [
    ["roman-urdu", "Roman Urdu"],
    ["urdu", "اردو (Urdu)"],
    ["english", "English"],
];

function List({ title, items }) {
    if (!items?.length) return null;
    return (
        <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/50">{title}</p>
            <ul className="space-y-1.5 text-sm">
                {items.map((t, i) => (
                    <li key={i} className="flex gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {t}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function ExplainModal({ prescription, onClose }) {
    const [language, setLanguage] = useState("roman-urdu");
    const [state, setState] = useState({ loading: false, data: null, locked: false });

    const run = async () => {
        setState({ loading: true, data: null, locked: false });
        try {
            const { data } = await api.post(ENDPOINTS.ai.explain(prescription._id), { language });
            setState({ loading: false, data, locked: false });
        } catch (e) {
            if (isLocked(e)) return setState({ loading: false, data: null, locked: true });
            toast.error(errMsg(e));
            setState({ loading: false, data: null, locked: false });
        }
    };

    const { data } = state;
    const ex = data?.explanation;
    const rtl = data?.language === "urdu";

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-[0_20px_60px_rgba(69,64,82,0.20)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/60 text-primary-dark">
                            <Sparkles size={18} />
                        </div>
                        <h3 className="text-lg font-semibold">Prescription samjhein</h3>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-ink/50 transition hover:bg-page" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {state.locked ? (
                    <LockedCard compact title="AI explanation Pro plan mein hai" />
                ) : (
                    <>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-[10rem] flex-1">
                                <Field as="select" label="Zubaan" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                    {LANGS.map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                    ))}
                                </Field>
                            </div>
                            <button
                                onClick={run}
                                disabled={state.loading}
                                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60"
                            >
                                {state.loading && <Loader2 size={16} className="animate-spin" />}
                                {ex ? "Dobara samjhayein" : "Samjhayein"}
                            </button>
                        </div>

                        {ex && (
                            <div dir={rtl ? "rtl" : "ltr"} className="mt-6 space-y-5">
                                {data.source === "fallback" && (
                                    <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{data.message}</p>
                                )}

                                <p className="rounded-xl bg-page p-4 text-sm leading-relaxed">{ex.summary}</p>

                                <div className="space-y-3">
                                    {ex.medicines.map((m, i) => (
                                        <div key={i} className="rounded-xl border border-line p-4">
                                            <p className="flex items-center gap-2 text-sm font-semibold">
                                                <Pill size={15} className="text-primary" />
                                                {[m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(" • ")}
                                            </p>
                                            {m.purpose && <p className="mt-2 text-sm text-ink/80">{m.purpose}</p>}
                                            {m.howToTake && <p className="mt-1 text-sm text-primary-dark">{m.howToTake}</p>}
                                        </div>
                                    ))}
                                </div>

                                {ex.doctorNotes && (
                                    <p className="text-sm text-ink/70">
                                        <span className="font-medium text-ink">Doctor ke notes: </span>
                                        {ex.doctorNotes}
                                    </p>
                                )}

                                <List title="Rozmarra ke mashwaray" items={ex.lifestyleTips} />
                                <List title="Ehtiyat" items={ex.preventiveAdvice} />
                                <List title="Doctor ko kab dikhayein" items={ex.whenToSeeDoctor} />

                                <p className="text-xs text-ink/50">{ex.disclaimer}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}