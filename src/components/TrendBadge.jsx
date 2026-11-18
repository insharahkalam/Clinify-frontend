import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export default function TrendBadge({ trend }) {
    const t = String(trend || "").toLowerCase();
    const up = /up|increas|grow|rising/.test(t);
    const down = /down|decreas|declin|fall/.test(t);
    const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
    const cls = up
        ? "bg-secondary/70 text-primary-dark"
        : down
            ? "bg-amber-50 text-amber-700"
            : "bg-page text-ink/60 ring-1 ring-line";
    const text = up ? "Barh raha hai" : down ? "Kam ho raha hai" : t === "no-data" ? "Data nahi" : "Stable";

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
            <Icon size={13} /> {text}
        </span>
    );
}