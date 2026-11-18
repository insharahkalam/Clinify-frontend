import toast from "react-hot-toast";
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export async function downloadPrescriptionPdf(id) {
    try {
        const res = await api.get(ENDPOINTS.prescriptionPdf(id), { responseType: "blob" });
        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `prescription-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        // Error blob ke andar aata hai, usay parh kar message dikhayein
        let msg = "PDF download nahi ho saki";
        try {
            msg = JSON.parse(await err.response.data.text()).message || msg;
        } catch { }
        toast.error(msg);
    }
}