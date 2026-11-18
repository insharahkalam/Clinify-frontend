import { NavLink, Outlet } from "react-router-dom";
import {
    LayoutDashboard, Users, Stethoscope, CalendarDays, Sparkles,
    FileText, CreditCard, FolderOpen, TrendingUp, LogOut, HeartPulse, ClipboardList, UserRound
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

export default function Layout() {
    const { user, logout } = useAuth();
    const items = NAV[user.role] || [];

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-white p-5 md:flex">
                <div className="mb-8 flex items-center gap-2.5 px-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
                        <HeartPulse size={20} />
                    </div>
                    <span className="text-lg font-semibold">MediCare</span>
                </div>

                <nav className="flex flex-1 flex-col gap-1">
                    {items.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/"}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive
                                    ? "bg-secondary/60 text-primary-dark"
                                    : "text-ink/70 hover:bg-page"
                                }`
                            }
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <button
                    onClick={logout}
                    className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-page"
                >
                    <LogOut size={18} /> Logout
                </button>
            </aside>

            {/* Main */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
                    <div className="flex items-center gap-2 md:hidden">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
                            <HeartPulse size={18} />
                        </div>
                        <span className="font-semibold">MediCare</span>
                    </div>
                    <div className="hidden md:block" />

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-semibold leading-tight">{user.name}</p>
                            <p className="text-xs capitalize text-ink/60">{user.role}</p>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-semibold text-primary-dark">
                            {user.name?.[0]?.toUpperCase()}
                        </div>
                        <button
                            onClick={logout}
                            className="rounded-lg p-2 text-ink/60 hover:bg-page md:hidden"
                            aria-label="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Mobile navigation */}
                <nav className="flex gap-1 overflow-x-auto border-b border-line bg-white px-4 py-2 md:hidden">
                    {items.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/"}
                            className={({ isActive }) =>
                                `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${isActive
                                    ? "bg-secondary/60 text-primary-dark"
                                    : "text-ink/70 hover:bg-page"
                                }`
                            }
                        >
                            <Icon size={15} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <main className="flex-1 p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}