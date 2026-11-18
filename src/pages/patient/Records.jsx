import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList } from "lucide-react";
import api from "../../api/axios";
import { ENDPOINTS } from "../../api/endpoints";
import { errMsg } from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import TimelineList from "../../components/TimelineList";

export default function Records() {
    const [items, setItems] = useState(null);

    useEffect(() => {
        api
            .get(ENDPOINTS.patient.timeline)
            .then(({ data }) => setItems(Array.isArray(data) ? data : []))
            .catch((e) => {
                toast.error(errMsg(e));
                setItems([]);
            });
    }, []);

    if (!items) return <Loader />;

    return (
        <div className="mx-auto max-w-3xl">
            <PageHeader title="Medical Records" subtitle="Aapki poori medical history ek timeline mein" />
            {items.length === 0 ? (
                <EmptyState icon={ClipboardList} title="Koi record nahi mila" text="Appointments, diagnosis aur prescriptions yahan jama honge." />
            ) : (
                <TimelineList items={items} />
            )}
        </div>
    );
}