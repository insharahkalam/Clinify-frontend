import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Sparkles } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, isLocked } from "../../utils/format";
import Field from "../../components/Field";
import PageHeader from "../../components/PageHeader";
import LockedCard from "../../components/LockedCard";

const card = "rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]";
const area =
    "w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-4 focus:ring-secondary/60";
const RISK = {
    high: ["bg-red-50 text-red-600", "Zyada khatra"],
    medium: ["bg-amber-50 text-amber-800", "Darmiyana khatra"],
    low: ["bg-secondary/70 text-primary-dark", "Kam khatra"],
};
const LIKELY = { high: "Zyada imkaan", medium: "Darmiyana imkaan", low: "Kam imkaan" };

export default function SymptomChecker() {
    const [patients, setPatients] = useState([]);
    const [locked, setLocked] = useState(false);
    const [form, setForm] = useState({ age: "", gender: "", symptoms: "", history: "" });
    const [loading, setLoading] = useState(false);
    const [res, setRes] = useState(null);

    useEffect(() => {
        api.get(ENDPOINTS.doctor.patients).then(({ data }) => setPatients(data)).catch(() => { });
        api
            .get(ENDPOINTS.subscription.features)
            .then(({ data }) => setLocked(!data.features?.ai))
            .catch(() => { });
    }, []);

    const set = (patch) => setForm((f) => ({ ...f, ...patch }));

    // Sirf age aur gender bharta hai. Patient ka naam AI ko kabhi nahi jata.
    const fillFrom = (id) => {
        const p = patients.find((x) => x._id === id);
        if (p) set({ age: p.age ?? "", gender: p.gender || "" });
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.symptoms.trim()) return toast.error("Symptoms likhein");

        setLoading(true);
        setRes(null);
        try {
            const { data } = await api.post(ENDPOINTS.ai.symptom, {
                symptoms: form.symptoms.trim(),
                age: form.age !== "" ? Number(form.age) : undefined,
                gender: form.gender || undefined,
                history: form.history.trim() || undefined,
            });
            setRes(data);
        } catch (err) {
            if (isLocked(err)) setLocked(true);
            else toast.error(errMsg(err));
        } finally {
            setLoading(false);
        }
    };

    if (locked) {
        return (
            <div className="mx-auto max-w-3xl">
                <PageHeader title="AI symptom checker" subtitle="Decision support" />
                <LockedCard title="AI symptom checker Pro plan mein hai" />
            </div>
        );
    }

    const r = res?.result;
    const [riskCls, riskLabel] = RISK[r?.riskLevel] || RISK.medium;

    return (
        <div className="mx-auto max-w-3xl">
            <PageHeader title="AI symptom checker" subtitle="Mumkina bimariyan aur tests ka mashwara. Final faisla hamesha doctor ka hai." />

            <form onSubmit={submit} className={`${card} space-y-5`}>
                <Field as="select" label="Patient se age aur gender bharein (optional)" defaultValue="" onChange={(e) => fillFrom(e.target.value)}>
                    <option value="">Patient chunein</option>
                    {patients.map((p) => (
                        <option key={p._id} value={p._id}>{p.user?.name}</option>
                    ))}
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Age" type="number" min="0" max="120" value={form.age} onChange={(e) => set({ age: e.target.value })} />
                    <Field as="select" label="Gender" value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </Field>
                </div>

                <label className="block">
                    <span className="mb-1.5 flex justify-between text-sm font-medium">
                        Symptoms <span className="font-normal text-ink/50">{form.symptoms.length}/1000</span>
                    </span>
                    <textarea
                        rows={4}
                        maxLength={1000}
                        className={area}
                        placeholder="Masalan: 3 din se bukhar, khansi aur gale mein dard"
                        value={form.symptoms}
                        onChange={(e) => set({ symptoms: e.target.value })}
                    />
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">Medical history (optional)</span>
                    <textarea
                        rows={2}
                        maxLength={1000}
                        className={area}
                        placeholder="Masalan: diabetes, pehle asthma ki shikayat"
                        value={form.history}
                        onChange={(e) => set({ history: e.target.value })}
                    />
                </label>

                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-ink/50">Patient ka naam AI ko nahi bheja jata.</p>
                    <button
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        Check karein
                    </button>
                </div>
            </form>

            {r && (
                <div className="mt-6 space-y-5">
                    {res.source === "fallback" && (
                        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{res.message}</p>
                    )}

                    <div className={card}>
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                            <h2 className="font-semibold">Nateeja</h2>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskCls}`}>{riskLabel}</span>
                        </div>

                        {r.possibleConditions.length > 0 && (
                            <div className="mb-5">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/50">Mumkina bimariyan</p>
                                <ul className="space-y-2">
                                    {r.possibleConditions.map((c, i) => (
                                        <li key={i} className="rounded-xl bg-page px-4 py-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-sm font-semibold capitalize">{c.name}</p>
                                                <span className="text-xs text-primary-dark">{LIKELY[c.likelihood] || c.likelihood}</span>
                                            </div>
                                            {c.reason && <p className="mt-1 text-sm text-ink/70">{c.reason}</p>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {r.suggestedTests.length > 0 && (
                            <div className="mb-5">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/50">Mashwara diye gaye tests</p>
                                <ul className="space-y-1.5 text-sm">
                                    {r.suggestedTests.map((t, i) => (
                                        <li key={i} className="flex gap-2.5">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {r.advice && <p className="rounded-xl bg-secondary/40 px-4 py-3 text-sm">{r.advice}</p>}
                        <p className="mt-4 text-xs text-ink/50">{r.disclaimer}</p>
                    </div>
                </div>
            )}
        </div>
    );
}