import { useEffect, useState } from "react";
import {
    Bot,
    CalendarCheck,
    CheckCircle2,
    HeartPulse,
    ShieldCheck,
    Sparkles,
    Stethoscope,
} from "lucide-react";
const PROMPTS = [
    {
        q: "Explain my blood report",
        a: "Your hemoglobin and sugar levels are normal. Vitamin D is slightly low \u2014 worth discussing supplements with your doctor.",
    },
    {
        q: "Is my blood pressure okay?",
        a: "Your last 7 readings average 118/78 \u2014 that's in the healthy range. Keep up the daily walks!",
    },
    {
        q: "When is my next visit?",
        a: "You're booked with Dr. Ayesha Malik on Thursday at 10:30 AM. I'll remind you a day before.",
    },
];
function AssistantDemo() {
    const [prompt, setPrompt] = useState(0);
    const [typed, setTyped] = useState("");
    const [thinking, setThinking] = useState(true);
    useEffect(() => {
        const answer = PROMPTS[prompt]?.a ?? "";
        let i = 0;
        let interval;
        setTyped("");
        setThinking(true);
        const start = setTimeout(() => {
            setThinking(false);
            interval = setInterval(() => {
                i += 1;
                setTyped(answer.slice(0, i));
                if (i >= answer.length) clearInterval(interval);
            }, 18);
        }, 800);
        return () => {
            clearTimeout(start);
            clearInterval(interval);
        };
    }, [prompt]);
    return (
        <div>
            <div className="space-y-3">
                <div
                    key={`q-${prompt}`}
                    className="ml-auto w-fit max-w-[85%] animate-fade-up rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-on-primary"
                >
                    {PROMPTS[prompt]?.q}
                </div>
                <div className="flex items-start gap-2">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ai-gradient text-on-primary">
                        <Bot size={16} />
                    </div>
                    <div className="min-h-16 flex-1 rounded-2xl rounded-tl-md bg-section px-4 py-2.5 text-sm text-ink">
                        {thinking ? (
                            <span className="flex h-5 items-center gap-1">
                                {[0, 150, 300].map((d) => (
                                    <span
                                        key={d}
                                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                                        style={{ animationDelay: `${d}ms` }}
                                    />
                                ))}
                            </span>
                        ) : (
                            <>
                                {typed}
                                <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-primary" />
                            </>
                        )}
                    </div>
                </div>
            </div>
            <p className="mb-2 mt-4 text-xs font-medium text-ink-muted">Try asking:</p>
            <div className="flex flex-wrap gap-2">
                {PROMPTS.map((p, i) => (
                    <button
                        key={p.q}
                        type="button"
                        onClick={() => setPrompt(i)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${i === prompt ? "border-primary bg-lavender-light text-primary" : "border-line text-ink-secondary hover:-translate-y-0.5 hover:border-primary hover:text-primary"}`}
                    >
                        {p.q}
                    </button>
                ))}
            </div>
        </div>
    );
}
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SLOTS = ["09:00", "10:30", "12:00", "14:30", "16:00", "17:30"];
const TAKEN = /* @__PURE__ */ new Set(["12:00", "16:00"]);
function AppointmentDemo() {
    const [day, setDay] = useState(1);
    const [slot, setSlot] = useState("10:30");
    const [booked, setBooked] = useState(false);
    return (
        <div>
            <div className="flex items-center gap-3 rounded-xl bg-section p-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-lavender-light text-primary">
                    <Stethoscope size={18} />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">Dr. Ayesha Malik</p>
                    <p className="text-xs text-ink-muted">Cardiologist · 4.9 rating</p>
                </div>
                <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-semibold text-success">
                    Available
                </span>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
                {DAYS.map((d, i) => (
                    <button
                        key={d}
                        type="button"
                        onClick={() => {
                            setDay(i);
                            setBooked(false);
                        }}
                        className={`rounded-xl py-2 text-xs font-semibold transition-all duration-200 active:scale-95 ${i === day ? "bg-primary text-on-primary shadow-hover" : "bg-section text-ink-secondary hover:text-primary"}`}
                    >
                        {d}
                    </button>
                ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
                {SLOTS.map((s) => {
                    const taken = TAKEN.has(s);
                    return (
                        <button
                            key={s}
                            type="button"
                            disabled={taken}
                            onClick={() => {
                                setSlot(s);
                                setBooked(false);
                            }}
                            className={`rounded-lg border py-1.5 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${s === slot && !taken ? "border-primary bg-lavender-light text-primary" : "border-line text-ink-secondary hover:border-primary hover:text-primary"}`}
                        >
                            {s}
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={() => setBooked(true)}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-on-primary transition-all duration-200 active:scale-[0.98] ${booked ? "bg-success" : "bg-primary hover:bg-primary-hover"}`}
            >
                {booked ? (
                    <>
                        <CheckCircle2 size={16} className="animate-pop" /> Booked for {DAYS[day]},{" "}
                        {slot}
                    </>
                ) : (
                    "Book appointment"
                )}
            </button>
        </div>
    );
}
const VITALS = [
    { label: "Blood pressure", value: "118/78", unit: "mmHg", week: [62, 70, 58, 66, 74, 60, 64] },
    { label: "Blood sugar", value: "96", unit: "mg/dL", week: [55, 68, 72, 50, 64, 58, 61] },
    { label: "Oxygen", value: "98", unit: "%", week: [88, 92, 90, 94, 91, 95, 93] },
];
function RecordsDemo() {
    const [bpm, setBpm] = useState(74);
    const [vital, setVital] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setBpm(72 + Math.floor(Math.random() * 8)), 1200);
        return () => clearInterval(timer);
    }, []);
    const selected = VITALS[vital] ?? VITALS[0];
    return (
        <div>
            <div className="flex items-center gap-4 rounded-xl bg-section p-3">
                <HeartPulse size={22} className="shrink-0 animate-pulse text-danger" />
                <svg
                    viewBox="0 0 200 40"
                    className="h-10 flex-1 text-primary"
                    fill="none"
                    aria-hidden
                >
                    <path
                        d="M0 20 H50 L58 8 L66 32 L74 4 L82 36 L90 20 H130 L138 12 L146 28 L154 20 H200"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="400"
                        className="animate-draw"
                    />
                </svg>
                <div className="text-right">
                    <p className="text-xl font-bold tabular-nums text-ink">{bpm}</p>
                    <p className="text-[10px] font-medium text-ink-muted">BPM</p>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
                {VITALS.map((v, i) => (
                    <button
                        key={v.label}
                        type="button"
                        onClick={() => setVital(i)}
                        className={`rounded-xl border p-2.5 text-left transition-all duration-200 active:scale-95 ${i === vital ? "border-primary bg-lavender-light" : "border-line hover:-translate-y-0.5 hover:border-primary"}`}
                    >
                        <p className="text-[10px] font-medium text-ink-muted">{v.label}</p>
                        <p className="text-sm font-bold text-ink">
                            {v.value}{" "}
                            <span className="text-[10px] font-medium text-ink-muted">{v.unit}</span>
                        </p>
                    </button>
                ))}
            </div>

            <div className="mt-3 rounded-xl bg-section p-3">
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink">{selected.label} · this week</p>
                    <span className="rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-semibold text-success">
                        Normal
                    </span>
                </div>
                <div key={vital} className="flex h-14 items-end gap-1.5">
                    {selected.week.map((h, i) => (
                        <div
                            key={i}
                            className="flex-1 origin-bottom animate-grow rounded-t-md bg-primary transition-colors hover:bg-primary-hover"
                            style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
const FEATURES = [
    {
        label: "AI Assistant",
        title: "Ask anything about your health",
        icon: Bot,
        Demo: AssistantDemo,
    },
    {
        label: "Appointments",
        title: "Book a doctor in seconds",
        icon: CalendarCheck,
        Demo: AppointmentDemo,
    },
    {
        label: "Health Records",
        title: "Your vitals at a glance",
        icon: HeartPulse,
        Demo: RecordsDemo,
    },
];
function AuthShowcase({ heading }) {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [spot, setSpot] = useState({ x: 50, y: 30 });
    const feature = FEATURES[active] ?? FEATURES[0];
    const { Demo, icon: FeatureIcon } = feature;
    const onMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        setSpot({ x: px * 100, y: py * 100 });
        setTilt({ x: (0.5 - py) * 6, y: (px - 0.5) * 6 });
    };
    return (
        <aside
            className="relative hidden overflow-clip rounded-3xl bg-ai-gradient p-8 text-on-primary lg:flex lg:flex-col lg:gap-6 xl:p-10"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => {
                setPaused(false);
                setTilt({ x: 0, y: 0 });
            }}
            onMouseMove={onMove}
        >
            {/* cursor spotlight + floating blobs */}
            <div
                className="pointer-events-none absolute h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card opacity-25 blur-3xl transition-all duration-300 ease-out"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            />
            <div
                className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 animate-blob rounded-full bg-primary opacity-40 blur-3xl"
                style={{ animationDelay: "-6s" }}
            />

            <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary shadow-card">
                    <Sparkles size={14} /> MediSync AI
                </span>
                <h2 className="mt-5 max-w-md text-3xl font-bold leading-tight">{heading}</h2>
                <p className="mt-2 text-sm font-medium">
                    Try the live preview below — it's interactive.
                </p>
            </div>

            {/* tilting live-demo card */}
            <div className="relative flex flex-1 items-center justify-center">
                <div
                    className="w-full max-w-md rounded-2xl bg-card p-5 text-ink shadow-hover transition-transform duration-200 ease-out"
                    style={{
                        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    }}
                >
                    <div key={active} className="animate-fade-up">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-lavender-light text-primary">
                                <FeatureIcon size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-primary">
                                    {feature.label}
                                </p>
                                <h3 className="text-base font-semibold">{feature.title}</h3>
                            </div>
                        </div>
                        <Demo />
                    </div>
                </div>
            </div>

            {/* feature tabs with auto-advance progress */}
            <div className="relative grid grid-cols-3 gap-2">
                {FEATURES.map((f, i) => {
                    const Icon = f.icon;
                    const isActive = i === active;
                    return (
                        <button
                            key={f.label}
                            type="button"
                            onClick={() => setActive(i)}
                            className={`relative overflow-hidden rounded-xl border-2 border-card px-3 py-2.5 text-left text-xs font-semibold transition-all duration-200 active:scale-95 ${isActive ? "bg-card text-primary shadow-card" : "hover:-translate-y-0.5 hover:bg-card hover:text-primary"}`}
                        >
                            <span className="flex flex-col items-start gap-1 xl:flex-row xl:items-center xl:gap-1.5">
                                <Icon size={14} />{" "}
                                <span className="whitespace-nowrap">{f.label}</span>
                            </span>
                            {isActive && (
                                <span className="absolute bottom-0 left-0 h-1 w-full bg-lavender-light">
                                    <span
                                        key={active}
                                        className="block h-full animate-progress bg-primary"
                                        style={{
                                            animationPlayState: paused ? "paused" : "running",
                                        }}
                                        onAnimationEnd={() =>
                                            setActive((a) => (a + 1) % FEATURES.length)
                                        }
                                    />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="relative flex items-center gap-2 text-sm font-medium">
                <ShieldCheck size={18} /> Your data is private and encrypted
            </div>
        </aside>
    );
}
export { AuthShowcase as default };
