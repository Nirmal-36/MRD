// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/users/login/`,
  REGISTER: `${API_BASE_URL}/users/register/`,
  PATIENT_REGISTER: `${API_BASE_URL}/users/patient_register/`,
  ME: `${API_BASE_URL}/users/me/`,
  CHANGE_PASSWORD: `${API_BASE_URL}/users/change_password/`,
  FORGOT_PASSWORD: `${API_BASE_URL}/users/forgot_password/`,
  VERIFY_OTP: `${API_BASE_URL}/users/verify_otp/`,
  RESET_PASSWORD: `${API_BASE_URL}/users/reset_password/`,
  
  // Dashboard
  DASHBOARD: `${API_BASE_URL}/dashboard/`,
  
  // Patients
  PATIENTS: `${API_BASE_URL}/patients/`,
  PATIENT_DETAIL: (id) => `${API_BASE_URL}/patients/${id}/`,
  SEARCH_USERS: `${API_BASE_URL}/patients/search_registered_users/`,
  DATA_CONSISTENCY: `${API_BASE_URL}/patients/data_consistency_report/`,
  
  // Treatments
  TREATMENTS: `${API_BASE_URL}/treatments/`,
  TREATMENT_DETAIL: (id) => `${API_BASE_URL}/treatments/${id}/`,
  TODAY_TREATMENTS: `${API_BASE_URL}/treatments/today/`,
  FOLLOW_UPS: `${API_BASE_URL}/treatments/follow_ups/`,
  
  // Beds
  BEDS: `${API_BASE_URL}/beds/`,
  BED_DETAIL: (id) => `${API_BASE_URL}/beds/${id}/`,
  BED_ALLOCATIONS: `${API_BASE_URL}/bed-allocations/`,
  BED_ALLOCATION_DETAIL: (id) => `${API_BASE_URL}/bed-allocations/${id}/`,
  
  // Medicines
  MEDICINES: `${API_BASE_URL}/medicines/`,
  MEDICINE_DETAIL: (id) => `${API_BASE_URL}/medicines/${id}/`,
  LOW_STOCK_MEDICINES: `${API_BASE_URL}/medicines/low_stock/`,
  MEDICINE_TRANSACTIONS: `${API_BASE_URL}/medicine-transactions/`,
  STOCK_REQUESTS: `${API_BASE_URL}/stock-requests/`,
  STOCK_REQUEST_DETAIL: (id) => `${API_BASE_URL}/stock-requests/${id}/`,
  
  // Cleaning
  CLEANING_RECORDS: `${API_BASE_URL}/cleaning-records/`,
  CLEANING_RECORD_DETAIL: (id) => `${API_BASE_URL}/cleaning-records/${id}/`,
  CLEANING_STAFF: `${API_BASE_URL}/cleaning-staff/`,
  CLEANING_STAFF_DETAIL: (id) => `${API_BASE_URL}/cleaning-staff/${id}/`,
  
  // Users
  USERS: `${API_BASE_URL}/users/`,
  USER_DETAIL: (id) => `${API_BASE_URL}/users/${id}/`,
  APPROVE_STAFF: `${API_BASE_URL}/users/approve_staff/`,
  
  // Profile Change Requests
  PROFILE_CHANGE_REQUESTS: `${API_BASE_URL}/profile-change-requests/`,
  PROFILE_CHANGE_REQUEST_DETAIL: (id) => `${API_BASE_URL}/profile-change-requests/${id}/`,
  PROFILE_CHANGE_REQUEST_APPROVE: (id) => `${API_BASE_URL}/profile-change-requests/${id}/approve/`,
  PROFILE_CHANGE_REQUEST_REJECT: (id) => `${API_BASE_URL}/profile-change-requests/${id}/reject/`,
  PROFILE_CHANGE_REQUESTS_PENDING: `${API_BASE_URL}/profile-change-requests/pending/`,
  MY_PROFILE_CHANGE_REQUESTS: `${API_BASE_URL}/profile-change-requests/my_requests/`,
};

export default API_BASE_URL;
