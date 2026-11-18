import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/patient/PatientDashboard";

import Profile from "./pages/patient/Profile";
import Prescriptions from "./pages/patient/Prescriptions";
import Records from "./pages/patient/Records";
import MyAppointments from "./pages/patient/MyAppointments";
import BookMyAppointment from "./pages/patient/BookMyAppointment";
import Reports from "./pages/patient/Reports";

import ReceptionistDashboard from "./pages/receptionist/Dashboard";
import PatientList from "./pages/receptionist/PatientList";
import PatientCreate from "./pages/receptionist/PatientCreate";
import PatientDetail from "./pages/receptionist/PatientDetail";
import Appointments from "./pages/receptionist/Appointments";
import BookAppointment from "./pages/receptionist/BookAppointment";

import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorAppointments from "./pages/doctor/Appointments";
import DoctorPatients from "./pages/doctor/Patients";
import DoctorPatientDetail from "./pages/doctor/PatientDetail";
import WritePrescription from "./pages/doctor/WritePrescription";
import DoctorPrescriptions from "./pages/doctor/Prescriptions";
import SymptomChecker from "./pages/doctor/SymptomChecker";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminDoctors from "./pages/admin/Doctors";
import AdminStaff from "./pages/admin/Staff";
import AdminPatients from "./pages/admin/Patients";
import AdminPlans from "./pages/admin/Plans";
import AdminAnalytics from "./pages/admin/Analytics";

// Ek hi path, alag roles ke liye alag page. Jis role ka page nahi bana wahan fallback.
const byRole = (map, fallback) =>
  function RoleRoute() {
    const { user } = useAuth();
    return map[user.role] || fallback;
  };

const HomeRoute = byRole(
  {
    admin: <AdminDashboard />,
    receptionist: <ReceptionistDashboard />,
    doctor: <DoctorDashboard />,
    patient: <PatientDashboard />,
  },
  <PatientDashboard />
);
const PatientsRoute = byRole({ admin: <AdminPatients />, receptionist: <PatientList />, doctor: <DoctorPatients /> });
const PatientDetailRoute = byRole({ receptionist: <PatientDetail />, doctor: <DoctorPatientDetail /> });
const AppointmentsRoute = byRole({
  receptionist: <Appointments />,
  doctor: <DoctorAppointments />,
  patient: <MyAppointments />,
});
const BookRoute = byRole({ receptionist: <BookAppointment />, patient: <BookMyAppointment /> });
const PrescriptionsRoute = byRole({ patient: <Prescriptions />, doctor: <DoctorPrescriptions /> });

const only = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<HomeRoute />} />

        {/* Patient */}
        <Route path="/profile" element={only(["patient"], <Profile />)} />
        <Route path="/records" element={only(["patient"], <Records />)} />
        <Route path="/reports" element={only(["patient"], <Reports />)} />

        {/* Shared paths, role ke hisaab se page */}
        <Route path="/patients" element={<PatientsRoute />} />
        <Route path="/patients/:id" element={<PatientDetailRoute />} />
        <Route path="/appointments" element={<AppointmentsRoute />} />
        <Route path="/appointments/new" element={<BookRoute />} />
        <Route path="/prescriptions" element={<PrescriptionsRoute />} />

        {/* Receptionist */}
        <Route path="/patients/new" element={only(["receptionist"], <PatientCreate />)} />

        {/* Doctor */}
        <Route path="/prescriptions/new" element={only(["doctor"], <WritePrescription />)} />
        <Route path="/symptom-checker" element={only(["doctor"], <SymptomChecker />)} />

        {/* Admin */}
        <Route path="/doctors" element={only(["admin"], <AdminDoctors />)} />
        <Route path="/staff" element={only(["admin"], <AdminStaff />)} />
        <Route path="/analytics" element={only(["admin"], <AdminAnalytics />)} />
        <Route path="/plans" element={only(["admin"], <AdminPlans />)} />

      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}