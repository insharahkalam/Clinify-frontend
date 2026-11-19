const P = "/patient";
const R = "/receptionist";
const A = "/appointments";


export const ENDPOINTS = {
    patient: {
        profile: `${P}/profile`,
        prescriptions: `${P}/prescriptions`,
        timeline: `${P}/timeline`,
    },
    receptionist: {
        patients: `${R}/patients`,
        patient: (id) => `${R}/patients/${id}`,
    },
    appointments: {
        doctors: `${A}/doctors`,
        schedule: `${A}/schedule`,
        book: A,
        status: (id) => `${A}/${id}/status`,
        cancel: (id) => `${A}/${id}/cancel`,
        reschedule: (id) => `${A}/${id}/reschedule`,
        byPatient: (id) => `${A}/patient/${id}`,
        availability: `${A}/availability`,
        my: `${A}/my`,
    },
    doctor: {
        patients: "/doctor/patients",
        patient: (id) => `/doctor/patients/${id}`,
        risk: (id) => `/doctor/patients/${id}/risk-flags`,
        diagnosis: "/doctor/diagnosis",
        prescriptions: "/doctor/prescriptions",
    },
    prescriptionPdf: (id) => `/prescriptions/${id}/pdf`,

    reports: {
        base: "/reports",
        file: (id) => `/reports/${id}/file`,
        remove: (id) => `/reports/${id}`,
    },

    admin: {
        staff: "/admin/staff",
        staffOne: (id) => `/admin/staff/${id}`,
        patients: "/admin/patients",
        staffPassword: (id) => `/admin/staff/${id}/password`,
    },
    subscription: {
        base: "/subscription",
        features: "/subscription/features",
        usage: "/subscription/usage",
    },
    analytics: {
        admin: "/analytics/admin",
        doctor: "/analytics/doctor",
        predictions: "/analytics/predictions",
    },
    ai: {
        status: "/ai/status",
        symptom: "/ai/symptom-check",
        explain: (id) => `/ai/prescriptions/${id}/explain`,
    },
    account: {
        password: "/account/password",
    },
};