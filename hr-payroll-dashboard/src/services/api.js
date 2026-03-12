import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ============ AUTH ============
export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/profile"),
};

// ============ EMPLOYEES ============
export const employeeService = {
  getAll: (params) => api.get("/employees", { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post("/employees", data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  search: (query) => api.get("/employees/search", { params: { q: query } }),
};

// ============ DEPARTMENTS ============
export const departmentService = {
  getAll: () => api.get("/departments"),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post("/departments", data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// ============ POSITIONS ============
export const positionService = {
  getAll: () => api.get("/positions"),
  getById: (id) => api.get(`/positions/${id}`),
  create: (data) => api.post("/positions", data),
  update: (id, data) => api.put(`/positions/${id}`, data),
  delete: (id) => api.delete(`/positions/${id}`),
};

// ============ PAYROLL ============
export const payrollService = {
  getAll: (params) => api.get("/payroll", { params }),
  getByEmployee: (employeeId, params) =>
    api.get(`/payroll/employee/${employeeId}`, { params }),
  create: (data) => api.post("/payroll", data),
  update: (id, data) => api.put(`/payroll/${id}`, data),
};

// ============ ATTENDANCE ============
export const attendanceService = {
  getAll: (params) => api.get("/attendance", { params }),
  getByEmployee: (employeeId, params) =>
    api.get(`/attendance/employee/${employeeId}`, { params }),
  create: (data) => api.post("/attendance", data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
};

// ============ DIVIDENDS ============
export const dividendService = {
  getAll: (params) => api.get("/dividends", { params }),
  getByEmployee: (employeeId) => api.get(`/dividends/employee/${employeeId}`),
};

// ============ REPORTS ============
export const reportService = {
  getDashboardStats: () => api.get("/reports/dashboard"),
  getHRReport: (params) => api.get("/reports/hr", { params }),
  getPayrollReport: (params) => api.get("/reports/payroll", { params }),
  getAttendanceReport: (params) => api.get("/reports/attendance", { params }),
  getDividendReport: (params) => api.get("/reports/dividends", { params }),
};

// ============ ALERTS ============
export const alertService = {
  getAll: () => api.get("/alerts"),
  getAnniversaries: () => api.get("/alerts/anniversaries"),
  getLeaveExceeded: () => api.get("/alerts/leave-exceeded"),
  getSalaryDiscrepancies: () => api.get("/alerts/salary-discrepancies"),
  markRead: (id) => api.put(`/alerts/${id}/read`),
};

export default api;
