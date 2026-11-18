import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, Crown, Loader2, Lock, Sparkles } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg, formatDate, planLimit, planUsed } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";
import UsageBar from "../../components/UsageBar";

const card = "rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(169,155,203,0.10)]";
const FEATURE_LABELS = {
    ai: "AI symptom checker aur prescription explanation",
    riskFlags: "Patient risk flags",
    advancedAnalytics: "Advanced analytics aur predictions",
};
const USAGE_LABELS = {
    symptom_check: "Symptom checker",
    prescription_explain: "Prescription explain",
    risk_flags: "Risk flags",
    pdf_download: "PDF download",
};
const humanize = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export default function Plans() {
    const [data, setData] = useState(null);
    const [failed, setFailed] = useState(false);
    const [months, setMonths] = useState(1);
    const [busy, setBusy] = useState(false);
    const [confirmFree, setConfirmFree] = useState(false);
    const [ai, setAi] = useState({ loading: false, data: null });

    const load = useCallback(async () => {
        try {
            const [f, u, s] = await Promise.all([
                api.get(ENDPOINTS.subscription.features),
                api.get(ENDPOINTS.subscription.usage),
                api.get(ENDPOINTS.subscription.base).catch(() => ({ data: null })),
            ]);
            setData({ features: f.data, usage: u.data, sub: s.data });
        } catch (e) {
            toast.error(errMsg(e));
            setFailed(true);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const change = async (plan) => {
        setBusy(true);
        try {
            const { data: res } = await api.put(ENDPOINTS.subscription.base, { plan, months: plan === "pro" ? months : undefined });
            toast.success(res.message || "Plan badal gaya");
            setConfirmFree(false);
            setAi({ loading: false, data: null });
            await load();
        } catch (e) {
            toast.error(errMsg(e));
        } finally {
            setBusy(false);
        }
    };

    const checkAi = async () => {
        setAi({ loading: true, data: null });
        try {
            const { data: res } = await api.get(ENDPOINTS.ai.status);
            setAi({ loading: false, data: res });
        } catch (e) {
            toast.error(errMsg(e));
            setAi({ loading: false, data: null });
        }
    };

    if (failed) return <p className="py-20 text-center text-sm text-ink/60">Plan ki maloomat load nahi ho saki.</p>;
    if (!data) return <Loader />;

    const { features, usage, sub } = data;
    const isPro = features.plan === "pro";
    const expiresAt = sub?.expiresAt;
    const expired = Boolean(sub?.expired);
    const month = usage.featureUsage?.thisMonth || {};
    const tm = usage.thisMonth || {};

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader title="Plan & Billing" subtitle="Clinic ka plan, limits aur istemal" />

            {expired && (
                <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Pro ki muddat khatam ho chuki hai, abhi Free plan chal raha hai.
                </p>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Current plan */}
                <div className={`${card} lg:col-span-2`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary/60 text-primary-dark">
                                <Crown size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-ink/60">Maujooda plan</p>
                                <p className="text-xl font-bold capitalize">{features.plan}</p>
                            </div>
                        </div>
                        {isPro && expiresAt && (
                            <span className="rounded-full bg-page px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-line">
                                Muddat: {formatDate(expiresAt)}
                            </span>
                        )}
                    </div>

                    <div className="my-6 border-t border-line" />
                    <UsageBar used={planUsed(usage.patientLimit)} limit={planLimit(usage.patientLimit)} />

                    <p className="mb-3 mt-7 text-xs font-medium uppercase tracking-wide text-ink/50">Features</p>
                    <ul className="space-y-2.5">
                        {Object.entries(features.features || {}).map(([key, on]) => (
                            <li key={key} className="flex items-center gap-3 text-sm">
                                <span className={`grid h-6 w-6 place-items-center rounded-full ${on ? "bg-secondary text-primary-dark" : "bg-page text-ink/30"}`}>
                                    {on ? <Check size={14} /> : <Lock size={12} />}
                                </span>
                                <span className={on ? "" : "text-ink/50"}>{FEATURE_LABELS[key] || humanize(key)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Upgrade */}
                <div className={`${card} h-fit`}>
                    <h2 className="font-semibold">{isPro ? "Pro renew karein" : "Pro mein upgrade"}</h2>
                    <p className="mt-1 text-sm text-ink/60">
                        Unlimited patients, AI, risk flags aur advanced analytics.
                    </p>

                    <label className="mt-5 block">
                        <span className="mb-1.5 block text-sm font-medium">Muddat</span>
                        <select
                            value={months}
                            onChange={(e) => setMonths(Number(e.target.value))}
                            className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-secondary/60"
                        >
                            {[1, 3, 6, 12].map((m) => (
                                <option key={m} value={m}>{m} mahina{m > 1 ? "e" : ""}</option>
                            ))}
                        </select>
                    </label>

                    <button
                        onClick={() => change("pro")}
                        disabled={busy}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60"
                    >
                        {busy && <Loader2 size={16} className="animate-spin" />}
                        {isPro ? "Muddat barhayein" : "Pro activate karein"}
                    </button>
                    <p className="mt-3 text-xs text-ink/50">Payment simulated hai, koi asli paisa nahi katta.</p>

                    {isPro && (
                        <button
                            onClick={() => setConfirmFree(true)}
                            className="mt-4 w-full rounded-xl border border-line py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page"
                        >
                            Free plan par wapis jayein
                        </button>
                    )}
                </div>
            </div>

            {/* Is mahine ki sargarmi */}
            <h2 className="mb-4 mt-8 font-semibold">Is mahine ka istemal</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    ["Naye patients", tm.newPatients],
                    ["Appointments", tm.appointments],
                    ["Diagnoses", tm.diagnoses],
                    ["Prescriptions", tm.prescriptions],
                ].map(([label, v]) => (
                    <div key={label} className={card}>
                        <p className="text-sm text-ink/60">{label}</p>
                        <p className="mt-1 text-2xl font-bold">{v ?? 0}</p>
                    </div>
                ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(USAGE_LABELS).map(([key, label]) => {
                    const u = month[key] || { total: 0, ai: 0, fallback: 0 };
                    return (
                        <div key={key} className={card}>
                            <p className="text-sm text-ink/60">{label}</p>
                            <p className="mt-1 text-2xl font-bold">{u.total}</p>
                            {(u.ai > 0 || u.fallback > 0) && (
                                <p className="mt-1 text-xs text-ink/50">AI: {u.ai} • Fallback: {u.fallback}</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* AI status */}
            {features.features?.ai && (
                <div className={`${card} mt-6`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/60 text-primary-dark">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h2 className="font-semibold">AI status</h2>
                                <p className="text-xs text-ink/50">Check karne par Gemini ko ek chhoti request jati hai.</p>
                            </div>
                        </div>
                        <button
                            onClick={checkAi}
                            disabled={ai.loading}
                            className="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-page disabled:opacity-60"
                        >
                            {ai.loading && <Loader2 size={15} className="animate-spin" />}
                            AI check karein
                        </button>
                    </div>

                    {ai.data && (
                        <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${ai.data.working ? "bg-secondary/50 text-primary-dark" : "bg-red-50 text-red-500"}`}>
                            {ai.data.working
                                ? `AI chal raha hai (model: ${ai.data.model})`
                                : `AI nahi chal raha: ${ai.data.error || "wajah maloom nahi"}`}
                        </p>
                    )}
                </div>
            )}

            {confirmFree && (
                <Modal title="Free plan par jayein?" onClose={() => setConfirmFree(false)}>
                    <p className="text-sm text-ink/70">
                        AI, risk flags aur advanced analytics band ho jayenge, aur patients ki limit laga di jayegi. Maujooda patients
                        rahenge.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setConfirmFree(false)} className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page">
                            Wapis
                        </button>
                        <button onClick={() => change("free")} disabled={busy} className="flex items-center gap-2 rounded-xl bg-red-400 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60">
                            {busy && <Loader2 size={16} className="animate-spin" />}
                            Haan, Free par jayein
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}