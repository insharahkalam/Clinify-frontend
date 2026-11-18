import { X } from "lucide-react";

export default function Modal({ title, onClose, children }) {
    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-[0_20px_60px_rgba(69,64,82,0.20)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-ink/50 transition hover:bg-page" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}