import { Users } from "lucide-react";
import StaffManager from "./StaffManager";

export default function Staff() {
    return (
        <StaffManager
            role="receptionist"
            title="Reception staff"
            subtitle="receptionists clinic mein hain"
            noun="Receptionist"
            addLabel="Add receptionist"
            icon={Users}
        />
    );
}