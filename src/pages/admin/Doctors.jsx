import { Stethoscope } from "lucide-react";
import StaffManager from "./StaffManager";

export default function Doctors() {
    return (
        <StaffManager
            role="doctor"
            title="Doctors"
            subtitle="doctors clinic mein hain"
            noun="Doctor"
            addLabel="Add doctor"
            icon={Stethoscope}
        />
    );
}