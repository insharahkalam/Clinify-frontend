const pad = (n) => String(n).padStart(2, "0");
const parse = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
};

export const formatDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "—";

export const errMsg = (err, fallback = "Kuch masla aa gaya") => {
    const data = err.response?.data;
    return data?.errors?.[0]?.msg || data?.message || fallback;
};

// ---- "YYYY-MM-DD" string helpers (backend isi format mein date rakhta hai) ----
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toISO(new Date());
export const shiftDate = (str, days) => {
    const d = parse(str);
    d.setDate(d.getDate() + days);
    return toISO(d);
};
export const formatDay = (str) =>
    parse(str).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
export const formatShortDay = (str) =>
    parse(str).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// "14:30" -> "2:30 PM"
export const formatTime = (t) => {
    const [h, m] = (t || "").split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return t || "—";
    return `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

// 09:00 se 16:30 tak, har 30 minute
export const SLOTS = Array.from({ length: 16 }, (_, i) => {
    const mins = 9 * 60 + i * 30;
    return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
});

export const nowTime = () => {
    const n = new Date();
    return `${pad(n.getHours())}:${pad(n.getMinutes())}`;
};

export const formatBytes = (n) => {
    if (!n) return "—";
    if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

// "2026-11" -> "Nov 26"
export const formatMonth = (m) => {
    const [y, mo] = (m || "").split("-").map(Number);
    if (!y || !mo) return m || "—";
    return new Date(y, mo - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
};

export const pkr = (n) => `Rs ${Number(n || 0).toLocaleString("en-US")}`;

// getPatientUsage ka shape alag ho sakta hai, isliye jo naam mile wo le lete hain
export const planLimit = (p) => p?.limit ?? p?.max ?? p?.maxPatients ?? null;
export const planUsed = (p) => p?.used ?? p?.count ?? 0;

export const formatWeekday = (str) =>
    parse(str).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });

// Backend ka "feature locked" jawab
export const isLocked = (err) => err?.response?.data?.code === "FEATURE_LOCKED";