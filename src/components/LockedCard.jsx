import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LockedCard({ title = "Ye feature Pro plan mein hai", compact = false }) {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    return (
        <div className={`rounded-2xl border border-dashed border-line bg-white text-center ${compact ? "p-6" : "p-12"}`}>
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-secondary/60 text-primary-dark">
                <Lock size={22} />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-ink/60">
                {isAdmin ? "Pro plan chalu karne par ye khul jayega." : "Clinic ke admin se Pro plan chalu karwayein."}
            </p>
            {isAdmin && (
                <Link
                    to="/plans"
                    className="mt-5 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:bg-primary-dark"
                >
                    Plan dekhein
                </Link>
            )}
        </div>
    );
}