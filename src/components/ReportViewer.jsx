import { useEffect, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { downloadReport } from "../utils/reportFile";

export default function ReportViewer({ report, onClose }) {
    const [url, setUrl] = useState(null);
    const [error, setError] = useState("");
    const isPdf = report.file?.format === "pdf";

    useEffect(() => {
        let objectUrl;
        let stale = false;

        api
            .get(ENDPOINTS.reports.file(report._id), { responseType: "blob" })
            .then((res) => {
                if (stale) return;
                console.log("report file:", res.data.type, res.data.size, "bytes");
                if (!res.data.size) return setError("File khali aayi hai");
                // Type khud set karte hain taake browser sahi pehchane
                const blob = new Blob([res.data], { type: report.file?.mimeType || res.data.type });
                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            })
            .catch(async (err) => {
                let msg = "Report khul nahi saki";
                try {
                    msg = JSON.parse(await err.response.data.text()).message || msg;
                } catch { }
                if (!stale) setError(msg);
            });

        return () => {
            stale = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [report._id]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-line bg-white"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                    <p className="truncate font-semibold">{report.title}</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => downloadReport(report._id, report.file?.originalName)}
                            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink/70 transition hover:bg-page"
                        >
                            <Download size={14} /> Download
                        </button>
                        <button onClick={onClose} className="rounded-lg p-1.5 text-ink/50 transition hover:bg-page" aria-label="Close">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 bg-page">
                    {error ? (
                        <p className="grid h-full place-items-center px-6 text-center text-sm text-red-500">{error}</p>
                    ) : !url ? (
                        <div className="grid h-full place-items-center text-primary">
                            <Loader2 className="animate-spin" size={28} />
                        </div>
                    ) : isPdf ? (
                        <iframe src={url} title={report.title} className="h-full w-full" />
                    ) : (
                        <div className="grid h-full place-items-center overflow-auto p-4">
                            <img src={url} alt={report.title} className="max-h-full max-w-full rounded-lg object-contain" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}