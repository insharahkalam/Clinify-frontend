import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Users, Stethoscope, CalendarDays, Sparkles,
    FileText, CreditCard, FolderOpen, KeyRound, TrendingUp, LogOut, HeartPulse, ClipboardList, UserRound,
    Menu, X, ChevronDown, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = {
    admin: [
        { to: "/", label: "Dashboard", icon: LayoutDashboard },
        { to: "/doctors", label: "Doctors", icon: Stethoscope },
        { to: "/staff", label: "Staff", icon: Users },
        { to: "/patients", label: "Patients", icon: ClipboardList },
        { to: "/analytics", label: "Analytics", icon: TrendingUp },
        { to: "/plans", label: "Plan & Billing", icon: CreditCard },
    ],
    doctor: [
        { to: "/", label: "Dashboard", icon: LayoutDashboard },
        { to: "/appointments", label: "Appointments", icon: CalendarDays },
        { to: "/patients", label: "My Patients", icon: Users },
        { to: "/prescriptions", label: "Prescriptions", icon: FileText },
        { to: "/symptom-checker", label: "Symptom Checker", icon: Sparkles },
    ],
    receptionist: [
        { to: "/", label: "Dashboard", icon: LayoutDashboard },
        { to: "/patients", label: "Patients", icon: Users },
        { to: "/appointments", label: "Appointments", icon: CalendarDays },
    ],
    patient: [
        { to: "/", label: "Dashboard", icon: LayoutDashboard },
        { to: "/profile", label: "My Profile", icon: UserRound },
        { to: "/prescriptions", label: "Prescriptions", icon: FileText },
        { to: "/records", label: "Medical Records", icon: ClipboardList },
        { to: "/reports", label: "My Reports", icon: FolderOpen },
        { to: "/appointments", label: "My Appointments", icon: CalendarDays },
    ],
};

const ACCOUNT = [{ to: "/password", label: "Password", icon: KeyRound }];
const COLLAPSE_KEY = "layout:collapsed";

const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
};

const initials = (name = "") =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("") || "?";

/* ---------- small pieces ---------- */
function Brand({ collapsed = false }) {
    return (
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`}>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/30">
                <HeartPulse size={20} />
            </div>
            {!collapsed && (
                <div className="leading-tight">
                    <p className="text-lg font-bold tracking-tight text-ink">MediCare</p>
                    <p className="text-[11px] font-medium text-ink/45">Clinic management</p>
                </div>
            )}
        </div>
    );
}

function Avatar({ name, size = "h-10 w-10", text = "text-sm" }) {
    return (
        <div
            className={`grid ${size} shrink-0 place-items-center rounded-full bg-gradient-to-br from-secondary to-secondary/50 font-semibold ${text} text-primary-dark ring-2 ring-white`}
        >
            {initials(name)}
        </div>
    );
}

function NavItem({ to, label, icon: Icon, collapsed, onClick }) {
    return (
        <NavLink
            to={to}
            end={to === "/"}
            onClick={onClick}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${focusRing} ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                } ${isActive
                    ? "bg-secondary/60 text-primary-dark"
                    : "text-ink/65 hover:bg-page hover:text-ink"
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200 ${isActive ? "opacity-100" : "scale-y-0 opacity-0"
                            } ${collapsed ? "-left-3" : "-left-5"}`}
                    />
                    <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-200 ${isActive
                            ? "bg-white text-primary shadow-sm"
                            : "text-ink/50 group-hover:bg-white group-hover:text-primary-dark"
                            }`}
                    >
                        <Icon size={17} />
                    </span>
                    {!collapsed && <span className="truncate">{label}</span>}
                </>
            )}
        </NavLink>
    );
}

function SectionLabel({ children, collapsed }) {
    if (collapsed) return <div className="mx-auto my-3 h-px w-6 bg-line" />;
    return <p className="mb-2 mt-1 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/35">{children}</p>;
}

/* ---------- main ---------- */
export default function Layout() {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const items = NAV[user.role] || [];

    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    /* remember collapsed sidebar */
    useEffect(() => {
        try {
            setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
        } catch {
            /* ignore */
        }
    }, []);

    const toggleCollapsed = () =>
        setCollapsed((c) => {
            try {
                localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
            } catch {
                /* ignore */
            }
            return !c;
        });

    /* close menus when the page changes */
    useEffect(() => {
        setDrawerOpen(false);
        setMenuOpen(false);
    }, [pathname]);

    /* Escape closes drawer / menu; lock page scroll while drawer is open */
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setDrawerOpen(false);
                setMenuOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [drawerOpen]);

    /* click outside closes the profile menu */
    useEffect(() => {
        if (!menuOpen) return;
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [menuOpen]);

    const pageTitle = useMemo(() => {
        const all = [...items, ...ACCOUNT];
        const match =
            all.find((i) => i.to !== "/" && (pathname === i.to || pathname.startsWith(`${i.to}/`))) ||
            all.find((i) => i.to === pathname);
        return match?.label || "Dashboard";
    }, [items, pathname]);

    const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
    const firstName = user.name?.split(" ")[0] || "";

    const sidebarBody = (isDrawer) => {
        const c = collapsed && !isDrawer;
        const close = isDrawer ? () => setDrawerOpen(false) : undefined;
        return (
            <>
                <div className={`flex items-center ${c ? "justify-center" : "justify-between"} pb-6`}>
                    <Brand collapsed={c} />
                    {isDrawer && (
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(false)}
                            className={`grid h-9 w-9 place-items-center rounded-xl text-ink/60 transition hover:bg-page ${focusRing}`}
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
                    <SectionLabel collapsed={c}>Menu</SectionLabel>
                    {items.map((i) => (
                        <NavItem key={i.to} {...i} collapsed={c} onClick={close} />
                    ))}

                    <SectionLabel collapsed={c}>Account</SectionLabel>
                    {ACCOUNT.map((i) => (
                        <NavItem key={i.to} {...i} collapsed={c} onClick={close} />
                    ))}
                </nav>

                {/* user card */}
                <div className={`mt-4 rounded-2xl border border-line bg-page/60 ${c ? "p-2" : "p-3"}`}>
                    <div className={`flex items-center gap-3 ${c ? "flex-col" : ""}`}>
                        <Avatar name={user.name} size={c ? "h-9 w-9" : "h-10 w-10"} />
                        {!c && (
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                                <p className="text-xs capitalize text-ink/50">{user.role}</p>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={logout}
                            title="Logout"
                            aria-label="Logout"
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink/50 transition hover:bg-red-50 hover:text-red-500 ${focusRing}`}
                        >
                            <LogOut size={17} />
                        </button>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="flex min-h-screen bg-page">
            {/* ---------- desktop sidebar ---------- */}
            <aside
                className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white py-6 transition-[width] duration-300 md:flex ${collapsed ? "w-[84px] px-3" : "w-64 px-5"
                    }`}
            >
                {sidebarBody(false)}

                <button
                    type="button"
                    onClick={toggleCollapsed}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className={`absolute -right-3.5 top-8 grid h-7 w-7 place-items-center rounded-full border border-line bg-white text-ink/50 shadow-sm transition hover:border-primary/40 hover:text-primary-dark ${focusRing}`}
                >
                    {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
                </button>
            </aside>

            {/* ---------- mobile drawer ---------- */}
            <div className={`fixed inset-0 z-50 md:hidden ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
                <div
                    onClick={() => setDrawerOpen(false)}
                    className={`absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
                />
                <aside
                    className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white px-5 py-6 shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? "translate-x-0" : "-translate-x-full"
                        }`}
                >
                    {sidebarBody(true)}
                </aside>
            </div>

            {/* ---------- main column ---------- */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur-md">
                    <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 md:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(true)}
                                className={`grid h-10 w-10 place-items-center rounded-xl border border-line text-ink/70 transition hover:bg-page md:hidden ${focusRing}`}
                                aria-label="Open menu"
                            >
                                <Menu size={18} />
                            </button>
                            <div className="min-w-0">
                                <h1 className="truncate text-base font-semibold text-ink sm:text-lg">{pageTitle}</h1>
                                <p className="hidden truncate text-xs text-ink/50 sm:block">
                                    {greeting()}, {firstName} · {today}
                                </p>
                            </div>
                        </div>

                        {/* profile menu */}
                        <div ref={menuRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((o) => !o)}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                className={`flex items-center gap-3 rounded-full border border-transparent py-1 pl-1 pr-2 transition hover:border-line hover:bg-page sm:pr-3 ${focusRing} ${menuOpen ? "border-line bg-page" : ""
                                    }`}
                            >
                                <Avatar name={user.name} size="h-9 w-9" />
                                <div className="hidden text-left sm:block">
                                    <p className="max-w-[10rem] truncate text-sm font-semibold leading-tight text-ink">{user.name}</p>
                                    <p className="text-[11px] capitalize text-ink/50">{user.role}</p>
                                </div>
                                <ChevronDown size={15} className={`text-ink/40 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
                            </button>

                            <div
                                role="menu"
                                className={`absolute right-0 top-full mt-2 w-60 origin-top-right rounded-2xl border border-line bg-white p-2 shadow-[0_16px_40px_rgba(169,155,203,0.25)] transition-all duration-150 ${menuOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                                    }`}
                            >
                                <div className="flex items-center gap-3 rounded-xl bg-page/70 p-3">
                                    <Avatar name={user.name} />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                                        <span className="mt-0.5 inline-block rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">
                                            {user.role}
                                        </span>
                                    </div>
                                </div>

                                <div className="my-2 h-px bg-line" />

                                {user.role === "patient" && (
                                    <NavLink
                                        to="/profile"
                                        role="menuitem"
                                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/70 transition hover:bg-page hover:text-ink"
                                    >
                                        <UserRound size={16} /> My profile
                                    </NavLink>
                                )}
                                <NavLink
                                    to="/password"
                                    role="menuitem"
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/70 transition hover:bg-page hover:text-ink"
                                >
                                    <KeyRound size={16} /> Change password
                                </NavLink>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={logout}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-500 transition hover:bg-red-50"
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
                    <div className="mx-auto w-full max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}