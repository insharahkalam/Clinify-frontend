import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    ArrowUpDown,
    ChevronRight,
    Droplet,
    LayoutGrid,
    List,
    Mail,
    Phone,
    Search,
    Users,
    X,
} from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg } from "../../utils/format";

/* ------------------------------------------------------------------ */
/*  Theme helpers (MediSync tokens)                                    */
/* ------------------------------------------------------------------ */
const focusRing = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25";
const delay = (ms) => ({ animationDelay: `${ms}ms` });

const SORTS = [
    { value: "name-asc", label: "Name (A–Z)" },
    { value: "name-desc", label: "Name (Z–A)" },
    { value: "age-asc", label: "Age (youngest)" },
    { value: "age-desc", label: "Age (oldest)" },
];

function initials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlight({ text, term }) {
    if (!text) return null;
    if (!term) return text;
    const parts = text.split(new RegExp(`(${escapeRe(term)})`, "ig"));
    return parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
            <mark key={i} className="rounded bg-lavender-medium/70 px-0.5 text-ink">
                {part}
            </mark>
        ) : (
            part
        )
    );
}

function Avatar({ name, size = "h-10 w-10 text-sm" }) {
    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-ai-gradient font-bold text-white shadow-sm transition duration-300 group-hover:scale-105 ${size}`}
        >
            {initials(name)}
        </div>
    );
}

function BloodBadge({ group }) {
    if (!group) return <span className="text-ink-muted">—</span>;
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2.5 py-1 text-xs font-semibold text-danger">
            <Droplet size={11} /> {group}
        </span>
    );
}

function Skeleton() {
    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="h-10 w-64 animate-pulse rounded-xl bg-lavender-light/70" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-lavender-light/50" />
            <div className="overflow-hidden rounded-2xl border border-line-light bg-card shadow-card">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 border-b border-line-light px-5 py-4 last:border-0">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender-light/80" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3.5 w-40 animate-pulse rounded bg-lavender-light/80" />
                            <div className="h-3 w-52 animate-pulse rounded bg-lavender-light/60" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function DoctorPatients() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState(null);
    const [q, setQ] = useState("");
    const [blood, setBlood] = useState("all");
    const [sort, setSort] = useState("name-asc");
    const [view, setView] = useState("list");

    useEffect(() => {
        api
            .get(ENDPOINTS.doctor.patients)
            .then(({ data }) => setPatients(data))
            .catch((e) => {
                toast.error(errMsg(e));
                setPatients([]);
            });
    }, []);

    const bloodGroups = useMemo(
        () => [...new Set((patients || []).map((p) => p.bloodGroup).filter(Boolean))].sort(),
        [patients]
    );

    const term = q.trim();

    const filtered = useMemo(() => {
        if (!patients) return [];
        const s = term.toLowerCase();

        const list = patients.filter((p) => {
            if (blood !== "all" && p.bloodGroup !== blood) return false;
            if (!s) return true;
            return [p.user?.name, p.user?.email, p.user?.phone].some((v) => v?.toLowerCase().includes(s));
        });

        const byName = (a, b) => (a.user?.name || "").localeCompare(b.user?.name || "");
        const byAge = (a, b, dir) => {
            if (a.age == null && b.age == null) return 0;
            if (a.age == null) return 1; // missing ages always last
            if (b.age == null) return -1;
            return dir * (a.age - b.age);
        };

        return [...list].sort((a, b) => {
            switch (sort) {
                case "name-desc":
                    return -byName(a, b);
                case "age-asc":
                    return byAge(a, b, 1);
                case "age-desc":
                    return byAge(a, b, -1);
                default:
                    return byName(a, b);
            }
        });
    }, [patients, term, blood, sort]);

    if (!patients) return <Skeleton />;

    const go = (id) => navigate(`/patients/${id}`);
    const onKey = (e, id) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            go(id);
        }
    };
    const hasFilters = Boolean(term) || blood !== "all";
    const resetFilters = () => {
        setQ("");
        setBlood("all");
    };

    return (
        <div className="mx-auto max-w-6xl">
            {/* ---------- Header ---------- */}
            <div className="animate-fade-up mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-ink">My Patients</h1>
                    <p className="mt-1 text-sm text-ink-secondary">
                        {patients.length} patient{patients.length === 1 ? "" : "s"} registered with you
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-lavender-light px-4 py-2 text-sm font-semibold text-lavender-deep">
                    <Users size={16} />
                    <span className="tabular-nums">{filtered.length}</span>
                    <span className="font-medium text-ink-secondary">shown</span>
                </div>
            </div>

            {/* ---------- Toolbar ---------- */}
            <div className="animate-fade-up mb-4 flex flex-wrap items-center gap-3" style={delay(60)}>
                <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-input-line bg-card px-3.5 shadow-card transition focus-within:border-focus focus-within:ring-4 focus-within:ring-primary/15 sm:max-w-sm">
                    <Search size={16} className="shrink-0 text-placeholder" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by name, email or phone"
                        className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-placeholder"
                    />
                    {q && (
                        <button
                            onClick={() => setQ("")}
                            aria-label="Clear search"
                            className="rounded-md p-1 text-ink-muted transition hover:bg-lavender-soft hover:text-ink"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-input-line bg-card px-3 shadow-card">
                    <ArrowUpDown size={14} className="text-placeholder" />
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        aria-label="Sort patients"
                        className="cursor-pointer bg-transparent py-2.5 pr-1 text-sm font-medium text-ink-secondary outline-none"
                    >
                        {SORTS.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="ml-auto inline-flex rounded-xl bg-section p-1">
                    {[
                        { v: "list", icon: List, label: "List view" },
                        { v: "grid", icon: LayoutGrid, label: "Card view" },
                    ].map(({ v, icon: Icon, label }) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            aria-label={label}
                            aria-pressed={view === v}
                            className={`rounded-lg p-2 transition ${focusRing} ${view === v ? "bg-card text-lavender-deep shadow-sm" : "text-ink-secondary hover:text-ink"
                                }`}
                        >
                            <Icon size={16} />
                        </button>
                    ))}
                </div>
            </div>

            {/* ---------- Blood group chips ---------- */}
            {bloodGroups.length > 0 && (
                <div className="animate-fade-up mb-5 flex flex-wrap items-center gap-2" style={delay(110)}>
                    <span className="mr-1 text-xs font-medium uppercase tracking-wide text-ink-muted">Blood group</span>
                    {["all", ...bloodGroups].map((b) => (
                        <button
                            key={b}
                            onClick={() => setBlood(b)}
                            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition active:scale-[0.96] ${focusRing} ${blood === b
                                ? "bg-primary text-on-primary shadow-md shadow-primary/30"
                                : "border border-line bg-card text-ink-secondary hover:border-lavender-medium hover:bg-lavender-soft"
                                }`}
                        >
                            {b === "all" ? "All" : b}
                        </button>
                    ))}
                </div>
            )}

            {/* ---------- Content ---------- */}
            {filtered.length === 0 ? (
                <div className="animate-fade-up flex flex-col items-center gap-3 rounded-2xl border border-dashed border-lavender-medium bg-section px-6 py-16 text-center">
                    <div className="animate-float flex h-16 w-16 items-center justify-center rounded-2xl bg-lavender-light text-lavender-deep">
                        <Users size={28} />
                    </div>
                    <h3 className="font-semibold text-ink">No patients found</h3>
                    <p className="max-w-xs text-sm text-ink-secondary">
                        {hasFilters
                            ? "Nothing matches your search or filters."
                            : "Patients who book an appointment with you will appear here."}
                    </p>
                    {hasFilters && (
                        <button
                            onClick={resetFilters}
                            className={`rounded-lg border border-input-line bg-card px-4 py-2 text-xs font-semibold text-lavender-deep transition hover:bg-lavender-soft ${focusRing}`}
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : view === "list" ? (
                <div className="overflow-hidden rounded-2xl border border-line-light bg-card shadow-card">
                    <div className="hidden items-center gap-4 bg-section px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted sm:flex">
                        <span className="flex-1">Patient</span>
                        <span className="w-36">Phone</span>
                        <span className="hidden w-32 md:block">Age / Gender</span>
                        <span className="hidden w-20 md:block">Blood</span>
                        <span className="w-5" />
                    </div>

                    <ul key={`${term}-${blood}-${sort}`} className="divide-y divide-line-light">
                        {filtered.map((p, i) => (
                            <li
                                key={p._id}
                                role="link"
                                tabIndex={0}
                                onClick={() => go(p._id)}
                                onKeyDown={(e) => onKey(e, p._id)}
                                style={delay(Math.min(i, 10) * 45)}
                                className={`animate-fade-up group relative flex cursor-pointer items-center gap-4 px-5 py-3.5 transition hover:bg-lavender-soft/70 ${focusRing}`}
                            >
                                <span className="absolute bottom-3 left-0 top-3 w-1 origin-center scale-y-50 rounded-r-full bg-primary opacity-0 transition duration-200 group-hover:scale-y-100 group-hover:opacity-100" />

                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <Avatar name={p.user?.name} />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-ink">
                                            <Highlight text={p.user?.name} term={term} />
                                        </p>
                                        <p className="truncate text-xs text-ink-secondary">
                                            <Highlight text={p.user?.email} term={term} />
                                        </p>
                                    </div>
                                </div>

                                <span className="hidden w-36 truncate text-sm text-ink-secondary sm:block">
                                    <Highlight text={p.user?.phone} term={term} /> {!p.user?.phone && "—"}
                                </span>
                                <span className="hidden w-32 text-sm capitalize text-ink-secondary md:block">
                                    {p.age ?? "—"} {p.gender ? `• ${p.gender}` : ""}
                                </span>
                                <span className="hidden w-20 md:block">
                                    <BloodBadge group={p.bloodGroup} />
                                </span>

                                <ChevronRight
                                    size={18}
                                    className="w-5 shrink-0 text-placeholder transition group-hover:translate-x-1 group-hover:text-lavender-deep"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div key={`${term}-${blood}-${sort}`} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((p, i) => (
                        <div
                            key={p._id}
                            role="link"
                            tabIndex={0}
                            onClick={() => go(p._id)}
                            onKeyDown={(e) => onKey(e, p._id)}
                            style={delay(Math.min(i, 9) * 60)}
                            className={`animate-fade-up group relative cursor-pointer overflow-hidden rounded-2xl border border-line-light bg-card p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-hover ${focusRing}`}
                        >
                            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-lavender-soft transition-transform duration-500 group-hover:scale-150" />

                            <div className="relative flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <Avatar name={p.user?.name} size="h-12 w-12 text-base" />
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-ink">
                                            <Highlight text={p.user?.name} term={term} />
                                        </p>
                                        <p className="text-xs capitalize text-ink-secondary">
                                            {p.age ?? "—"} yrs {p.gender ? `• ${p.gender}` : ""}
                                        </p>
                                    </div>
                                </div>
                                <BloodBadge group={p.bloodGroup} />
                            </div>

                            <div className="relative mt-4 space-y-1.5 text-xs text-ink-secondary">
                                <p className="flex items-center gap-2 truncate">
                                    <Mail size={13} className="shrink-0 text-placeholder" />
                                    <Highlight text={p.user?.email} term={term} />
                                </p>
                                <p className="flex items-center gap-2 truncate">
                                    <Phone size={13} className="shrink-0 text-placeholder" />
                                    {p.user?.phone ? <Highlight text={p.user.phone} term={term} /> : "No phone"}
                                </p>
                            </div>

                            <div className="relative mt-4 flex items-center justify-end gap-1 text-xs font-semibold text-lavender-deep">
                                View profile
                                <ChevronRight size={14} className="transition group-hover:translate-x-1" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}