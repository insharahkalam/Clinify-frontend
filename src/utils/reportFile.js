import toast from "react-hot-toast";
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

// Error blob ke andar aata hai, usay parh kar message nikalte hain
const blobError = async (err, fallback) => {
    try {
        return JSON.parse(await err.response.data.text()).message || fallback;
    } catch {
        return fallback;
    }
};

const fetchFile = (id) => api.get(ENDPOINTS.reports.file(id), { responseType: "blob" });

// Nayi tab mein kholna (tab pehle kholte hain taake popup block na ho)
export async function openReport(id) {
    const tab = window.open("", "_blank");
    try {
        const res = await fetchFile(id);
        const url = URL.createObjectURL(res.data);
        if (tab) tab.location.href = url;
        else window.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
        tab?.close();
        toast.error(await blobError(err, "Report khul nahi saki"));
    }
}

export async function downloadReport(id, name = "report") {
    try {
        const res = await fetchFile(id);
        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        toast.error(await blobError(err, "Report download nahi ho saki"));
    }
}