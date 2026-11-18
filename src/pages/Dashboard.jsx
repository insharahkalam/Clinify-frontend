import { useEffect, useState } from "react";
import {
    CalendarDays,
    ClipboardList,
    CreditCard,
    FileText,
    Sparkles,
    Stethoscope,
    TrendingUp,
    Users,
    X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "../index.css"

const CARDS = {
    admin: [
        { key: "doctors", label: "Doctors", hint: "Active on the platform", icon: Stethoscope },
        { key: "patients", label: "Patients", hint: "Total registered", icon: ClipboardList },
        { key: "staff", label: "Staff", hint: "Receptionists & admins", icon: Users },
        { key: "plan", label: "Current plan", hint: "Your subscription", icon: CreditCard },
    ],
    doctor: [
        { key: "todayAppointments", label: "Today's appointments", hint: "Scheduled for today", icon: CalendarDays },
        { key: "myPatients", label: "My patients", hint: "Under your care", icon: Users },
        { key: "prescriptions", label: "Prescriptions", hint: "Written so far", icon: FileText },
    ],
    receptionist: [
        { key: "todayAppointments", label: "Today's appointments", hint: "Booked for today", icon: CalendarDays },
        { key: "registeredPatients", label: "Registered patients", hint: "In the system", icon: Users },
    ],
    patient: [
        { key: "upcomingAppointments", label: "Upcoming appointments", hint: "Your next visits", icon: CalendarDays },
        { key: "medicalRecords", label: "Medical records", hint: "Reports & prescriptions", icon: FileText },
    ],
};

const TIPS = {
    admin: [
        "Keep doctor schedules up to date so patients can book open slots.",
        "Review new staff accounts regularly to keep access secure.",
        "Check your plan limits before adding more doctors.",
    ],
    doctor: [
        "Review today's appointments before your first consultation.",
        "Add notes right after each visit — it keeps patient history accurate.",
        "Use prescription templates to save time on common treatments.",
    ],
    receptionist: [
        "Confirm today's appointments early to reduce no-shows.",
        "Double-check phone numbers when registering new patients.",
        "Keep the waiting list updated as patients check in.",
    ],
    patient: [
        "Upload your latest reports so your doctor sees the full picture.",
        "Arrive 10 minutes early for your appointment.",
        "Keep your medical details up to date in your profile.",
    ],
};

const ROLE_LABEL = {
    admin: "Admin",
    doctor: "Doctor",
    receptionist: "Receptionist",
    patient: "Patient",
};

function greetingFor(hour) {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

// Counts up from 0 to the target number.
function useCountUp(target, duration = 900) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (target === null) return;
        let frame = 0;
        const start = performance.now();
        const tick = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);
    return value;
}

function StatCard({ card, value, index }) {
    const Icon = card.icon;
    const numeric = typeof value === "number" ? value : null;
    const counted = useCountUp(numeric);
    const hasValue = value !== undefined && value !== null && value !== "";

    // Moves the soft glow to follow the cursor.
    const onMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
    };

    return (
        <div
            onMouseMove={onMove}
            className="group relative animate-fade-up overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:shadow-hover"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background:
                        "radial-gradient(220px circle at var(--x, 50%) var(--y, 50%), var(--lavender-light, #EDE6FC), transparent 70%)",
                }}
            />
            <div className="relative">
                <div className="mb-4 flex items-start justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-lavender-light text-primary transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary">
                        <Icon size={20} />
                    </div>
                    {hasValue && (
                        <TrendingUp
                            size={16}
                            className="text-ink-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />
                    )}
                </div>
                <p className="text-sm font-medium text-ink-secondary">{card.label}</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-ink">
                    {numeric !== null ? counted.toLocaleString() : hasValue ? value : "—"}
                </p>
                <p className="mt-1 text-xs text-ink-muted">{hasValue ? card.hint : "No data yet"}</p>
            </div>
        </div>
    );
}

function TipsBanner({ role }) {
    const tips = TIPS[role] ?? TIPS["patient"] ?? [];
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        if (paused || hidden) return;
        const timer = setInterval(() => setIndex((i) => (i + 1) % tips.length), 5000);
        return () => clearInterval(timer);
    }, [paused, hidden, tips.length]);

    if (hidden) return null;

    return (
        <div
            className="relative mt-6 animate-fade-up overflow-hidden rounded-2xl bg-ai-gradient p-5 text-on-primary shadow-card"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 animate-blob rounded-full bg-card opacity-20 blur-2xl" />
            <div className="relative flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 animate-float place-items-center rounded-xl bg-card text-primary">
                    <Sparkles size={18} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider">AI tip for you</p>
                    <p key={`${role}-${index}`} className="mt-1 animate-fade-up text-sm font-medium sm:text-base">
                        {tips[index]}
                    </p>
                    <div className="mt-3 flex gap-1.5">
                        {tips.map((tip, i) => (
                            <button
                                key={tip}
                                type="button"
                                aria-label={`Show tip ${i + 1}`}
                                onClick={() => setIndex(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-card" : "w-1.5 bg-card opacity-50 hover:opacity-100"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
                <button
                    type="button"
                    aria-label="Hide tips"
                    onClick={() => setHidden(true)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition hover:bg-card hover:text-primary active:scale-90"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

// `stats` is optional: pass numbers from your API keyed by card key,
// e.g. <Dashboard stats={{ doctors: 12, patients: 340, plan: "Pro" }} />
export default function Dashboard({ stats = {} }) {
    const { user } = useAuth();
    const role = user?.role || "patient";
    const cards = CARDS[role] || [];
    const firstName = (user?.name || "").split(" ")[0];
    const [now, setNow] = useState(null);

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="animate-fade-up">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender-light px-3 py-1 text-xs font-semibold text-primary">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                        {ROLE_LABEL[role] || role}
                    </span>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                        {now ? greetingFor(now.getHours()) : "Hello"}, {firstName}{" "}
                        <span className="inline-block origin-[70%_70%] animate-wave">👋</span>
                    </h1>
                    <p className="mt-1 text-sm text-ink-secondary">Here's your overview for today.</p>
                </div>

                {now && (
                    <div className="animate-fade-up self-start rounded-xl border border-line bg-card px-4 py-2.5 shadow-card sm:self-auto sm:text-right">
                        <p className="text-xs font-medium text-ink-muted">
                            {now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                        <p className="text-lg font-bold tabular-nums text-ink">
                            {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                    </div>
                )}
            </div>

            <TipsBanner key={role} role={role} />

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card, i) => (
                    <StatCard key={`${role}-${card.key}`} card={card} value={stats[card.key]} index={i} />
                ))}
            </div>
        </div>
    );
}
