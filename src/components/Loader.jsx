import { Loader2 } from "lucide-react";

export default function Loader() {
    return (
        <div className="grid place-items-center py-24 text-primary">
            <Loader2 className="animate-spin" size={28} />
        </div>
    );
}