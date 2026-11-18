import PageHeader from "../../components/PageHeader";
import ReportsPanel from "../../components/ReportsPanel";

export default function Reports() {
    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader title="My Reports" subtitle="Lab reports, X-ray aur scans, sab yahan mehfooz hain" />
            <ReportsPanel />
        </div>
    );
}