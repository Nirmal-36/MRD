import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service Object
const apiService = {
  // Authentication
  login: (credentials) => apiClient.post(API_ENDPOINTS.LOGIN, credentials),
  register: (data) => apiClient.post(API_ENDPOINTS.REGISTER, data),
  patientRegister: (data) => apiClient.post(API_ENDPOINTS.PATIENT_REGISTER, data),
  getCurrentUser: () => apiClient.get(API_ENDPOINTS.ME),
  getMe: () => apiClient.get(API_ENDPOINTS.ME),
  updateMe: (data) => apiClient.patch(API_ENDPOINTS.ME, data),
  changePassword: (data) => apiClient.post(API_ENDPOINTS.CHANGE_PASSWORD, data),
  forgotPassword: (data) => apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, data),
  verifyOTP: (data) => apiClient.post(API_ENDPOINTS.VERIFY_OTP, data),
  resetPassword: (data) => apiClient.post(API_ENDPOINTS.RESET_PASSWORD, data),

  // Dashboard
  getDashboard: () => apiClient.get(API_ENDPOINTS.DASHBOARD),
  getPrincipalDashboard: () => apiClient.get('/principal-dashboard/'),
  getHODDashboard: (params) => apiClient.get('/hod-dashboard/', { params }),

  // Common Reports (accessible by Principal, HOD, and Admin)
  getStudentHealthReport: (params) => apiClient.get('/common-reports/student-health/', { params }),
  getHighRiskStudents: (params) => apiClient.get('/common-reports/high-risk-students/', { params }),
  getUtilizationRate: (params) => apiClient.get('/common-reports/utilization-rate/', { params }),
  getCriticalStock: (params) => apiClient.get('/common-reports/critical-stock/', { params }),
  getInventoryExpiry: (params) => apiClient.get('/common-reports/inventory-expiry/', { params }),
  getPendingStockRequests: (params) => apiClient.get('/common-reports/pending-requests/', { params }),
  getBedCapacityReport: (params) => apiClient.get('/common-reports/bed-capacity/', { params }),

  // Patients
  getPatients: (params) => apiClient.get(API_ENDPOINTS.PATIENTS, { params }),
  getPatient: (id) => apiClient.get(API_ENDPOINTS.PATIENT_DETAIL(id)),
  createPatient: (data) => apiClient.post(API_ENDPOINTS.PATIENTS, data),
  updatePatient: (id, data) => apiClient.put(API_ENDPOINTS.PATIENT_DETAIL(id), data),
  deletePatient: (id) => apiClient.delete(API_ENDPOINTS.PATIENT_DETAIL(id)),
  searchUsers: (query) => apiClient.get(API_ENDPOINTS.SEARCH_USERS, { params: { q: query } }),
  getDataConsistency: () => apiClient.get(API_ENDPOINTS.DATA_CONSISTENCY),
  searchPatientById: (id) => apiClient.get(`${API_ENDPOINTS.PATIENTS}search_by_id/?id=${id}`),
  getMyProfile: () => apiClient.get(`${API_ENDPOINTS.PATIENTS}my_profile/`),
  updateMyProfile: (data) => apiClient.patch(`${API_ENDPOINTS.PATIENTS}update_profile/`, data),

  // Treatments
  getTreatments: (params) => apiClient.get(API_ENDPOINTS.TREATMENTS, { params }),
  getTreatment: (id) => apiClient.get(API_ENDPOINTS.TREATMENT_DETAIL(id)),
  createTreatment: (data) => apiClient.post(API_ENDPOINTS.TREATMENTS, data),
  updateTreatment: (id, data) => apiClient.put(API_ENDPOINTS.TREATMENT_DETAIL(id), data),
  deleteTreatment: (id) => apiClient.delete(API_ENDPOINTS.TREATMENT_DETAIL(id)),
  getTodayTreatments: () => apiClient.get(API_ENDPOINTS.TODAY_TREATMENTS),
  getFollowUps: () => apiClient.get(API_ENDPOINTS.FOLLOW_UPS),
  prescribeMedicine: (treatmentId, data) => apiClient.post(`${API_ENDPOINTS.TREATMENTS}${treatmentId}/prescribe_medicine/`, data),
  getTreatmentMedicines: (treatmentId) => apiClient.get(`${API_ENDPOINTS.TREATMENTS}${treatmentId}/medicines/`),

  // Beds
  getBeds: (params) => apiClient.get(API_ENDPOINTS.BEDS, { params }),
  getBed: (id) => apiClient.get(API_ENDPOINTS.BED_DETAIL(id)),
  createBed: (data) => apiClient.post(API_ENDPOINTS.BEDS, data),
  updateBed: (id, data) => apiClient.put(API_ENDPOINTS.BED_DETAIL(id), data),
  deleteBed: (id) => apiClient.delete(API_ENDPOINTS.BED_DETAIL(id)),

  // Bed Allocations
  getBedAllocations: (params) => apiClient.get(API_ENDPOINTS.BED_ALLOCATIONS, { params }),
  createBedAllocation: (data) => apiClient.post(API_ENDPOINTS.BED_ALLOCATIONS, data),
  updateBedAllocation: (id, data) => apiClient.put(API_ENDPOINTS.BED_ALLOCATION_DETAIL(id), data),
  deleteBedAllocation: (id) => apiClient.delete(API_ENDPOINTS.BED_ALLOCATION_DETAIL(id)),
  dischargeBedAllocation: (id, data) => apiClient.post(`${API_ENDPOINTS.BED_ALLOCATIONS}${id}/discharge/`, data),
  getActiveBedAllocations: () => apiClient.get(`${API_ENDPOINTS.BED_ALLOCATIONS}active/`),
  getAvailableBeds: (params) => apiClient.get(`${API_ENDPOINTS.BEDS}available/`, { params }),

  // Medicines
  getMedicines: (params) => apiClient.get(API_ENDPOINTS.MEDICINES, { params }),
  getMedicine: (id) => apiClient.get(API_ENDPOINTS.MEDICINE_DETAIL(id)),
  createMedicine: (data) => apiClient.post(API_ENDPOINTS.MEDICINES, data),
  updateMedicine: (id, data) => apiClient.put(API_ENDPOINTS.MEDICINE_DETAIL(id), data),
  deleteMedicine: (id) => apiClient.delete(API_ENDPOINTS.MEDICINE_DETAIL(id)),
  getLowStockMedicines: () => apiClient.get(API_ENDPOINTS.LOW_STOCK_MEDICINES),

  // Medicine Transactions
  getMedicineTransactions: (params) => apiClient.get(API_ENDPOINTS.MEDICINE_TRANSACTIONS, { params }),
  createMedicineTransaction: (data) => apiClient.post(API_ENDPOINTS.MEDICINE_TRANSACTIONS, data),

  // Stock Requests
  getStockRequests: (params) => apiClient.get(API_ENDPOINTS.STOCK_REQUESTS, { params }),
  getStockRequest: (id) => apiClient.get(API_ENDPOINTS.STOCK_REQUEST_DETAIL(id)),
  createStockRequest: (data) => apiClient.post(API_ENDPOINTS.STOCK_REQUESTS, data),
  approveStockRequest: (id, data) => apiClient.post(`${API_ENDPOINTS.STOCK_REQUESTS}${id}/approve/`, data),
  rejectStockRequest: (id, data) => apiClient.post(`${API_ENDPOINTS.STOCK_REQUESTS}${id}/reject/`, data),

  // Cleaning
  getCleaningSchedules: (params) => apiClient.get(API_ENDPOINTS.CLEANING, { params }),
  createCleaningSchedule: (data) => apiClient.post(API_ENDPOINTS.CLEANING, data),
  updateCleaningSchedule: (id, data) => apiClient.put(API_ENDPOINTS.CLEANING_DETAIL(id), data),
  deleteCleaningSchedule: (id) => apiClient.delete(API_ENDPOINTS.CLEANING_DETAIL(id)),

  // Users
  getUsers: (params) => apiClient.get(API_ENDPOINTS.USERS, { params }),
  getUser: (id) => apiClient.get(API_ENDPOINTS.USER_DETAIL(id)),
  updateUser: (id, data) => apiClient.put(API_ENDPOINTS.USER_DETAIL(id), data),
  deleteUser: (id) => apiClient.delete(API_ENDPOINTS.USER_DETAIL(id)),
  getAvailableDoctors: () => apiClient.get(`${API_ENDPOINTS.USERS}doctors/`),
  approveStaff: (data) => apiClient.post(API_ENDPOINTS.APPROVE_STAFF, data),

  // Export Functions - Returns file download
  exportPatients: () => apiClient.get('/export/patients/', { responseType: 'blob' }),
  exportTreatments: (params) => apiClient.get('/export/treatments/', { params, responseType: 'blob' }),
  exportHighRiskPatients: () => apiClient.get('/export/high-risk-patients/', { responseType: 'blob' }),
  
  exportMedicineInventory: () => apiClient.get('/export/medicine-inventory/', { responseType: 'blob' }),
  exportLowStockMedicines: () => apiClient.get('/export/low-stock-medicines/', { responseType: 'blob' }),
  exportExpiringMedicines: (params) => apiClient.get('/export/expiring-medicines/', { params, responseType: 'blob' }),
  exportMedicineTransactions: (params) => apiClient.get('/export/medicine-transactions/', { params, responseType: 'blob' }),
  exportStockRequests: (params) => apiClient.get('/export/stock-requests/', { params, responseType: 'blob' }),
  
  exportBedAllocations: (params) => apiClient.get('/export/bed-allocations/', { params, responseType: 'blob' }),
  exportBedInventory: () => apiClient.get('/export/bed-inventory/', { responseType: 'blob' }),
  exportCurrentPatients: () => apiClient.get('/export/current-patients/', { responseType: 'blob' }),
  
  exportCleaningRecords: (params) => apiClient.get('/export/cleaning-records/', { params, responseType: 'blob' }),
  exportStaffDirectory: () => apiClient.get('/export/staff-directory/', { responseType: 'blob' }),
  exportStudentDirectory: () => apiClient.get('/export/student-directory/', { responseType: 'blob' }),
  exportEmployeeDirectory: () => apiClient.get('/export/employee-directory/', { responseType: 'blob' }),

};

export default apiService;
