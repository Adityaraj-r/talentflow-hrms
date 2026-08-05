import axios from "axios";
import apiClient from "./apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export const getPayrollRecords = (month, year) =>
  apiClient.get("/payroll", { params: { month, year } });

export const getPayrollSettings = () => apiClient.get("/payroll/settings");
export const updatePayrollSettings = (data) => apiClient.put("/payroll/settings", data);

export const calculatePayrollPreview = (body) =>
  apiClient.post("/payroll/calculate-preview", body);

export const generatePayroll = (data) =>
  apiClient.post("/payroll/generate", data);

export const patchPayrollWorkflow = (id, body, axiosConfig = {}) =>
  apiClient.patch(`/payroll/${id}/workflow`, body, axiosConfig);

export const updatePayrollStatus = (id, status, extra = {}) =>
  apiClient.patch(`/payroll/${id}/status`, { status, ...extra });

export const exportPayrollBankCsv = (id) =>
  apiClient.get(`/payroll/${id}/export/bank`, { responseType: "blob" });

export const getPayrollAnalytics = (year) =>
  apiClient.get("/payroll/analytics/summary", { params: { year } });

export const getPayrollAuditLogs = (params = {}) =>
  apiClient.get("/payroll/audit-logs", { params });

export const getPayrollComplianceSummary = (month, year) =>
  apiClient.get("/payroll/compliance/summary", { params: { month, year } });

export const getSalarySlip = (payrollId, employeeId) =>
  apiClient.get(`/payroll/${payrollId}/slip/${employeeId}`);

export const downloadPayslip = (payrollId, employeeId) =>
  apiClient.get(`/payroll/${payrollId}/download/${employeeId}`, {
    responseType: "blob",
  });

export async function downloadPayslipWithFilename(payrollId, employeeId) {
  const token = localStorage.getItem("token") || localStorage.getItem("idToken");
  const res = await axios.get(
    `${API_BASE}/payroll/${payrollId}/download/${employeeId}`,
    {
      responseType: "blob",
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("idToken");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (res.status >= 400) {
    let msg = "Download failed";
    try {
      const t = await res.data.text();
      const j = JSON.parse(t);
      msg = j.error || j.message || msg;
    } catch {
      msg = `HTTP ${res.status}`;
    }
    throw new Error(msg);
  }
  const cd = res.headers["content-disposition"] || "";
  let filename = "payslip.pdf";
  const mStar = cd.match(/filename\*=UTF-8''([^;\s]+)/i);
  const mQuoted = cd.match(/filename="([^"]+)"/i);
  if (mStar?.[1]) {
    try {
      filename = decodeURIComponent(mStar[1]);
    } catch {
      filename = mStar[1];
    }
  } else if (mQuoted?.[1]) {
    filename = mQuoted[1];
  }
  return { blob: res.data, filename };
}

export const getPendingPayroll = (month, year) =>
  apiClient.get("/payroll/pending", { params: { month, year } });

export const getEmployeePayrollHistory = (userId) =>
  apiClient.get(`/payroll/history/${userId}`);

export const getTickets = (params = {}) =>
  apiClient.get("/payroll/tickets", { params });

export const createTicket = (data) =>
  apiClient.post("/payroll/tickets", data);

export const updateTicketStatus = (id, status, rejectionReason) =>
  apiClient.patch(`/payroll/tickets/${id}/status`, { status, rejectionReason });

export const calculateIndemnity = (data) =>
  apiClient.post("/payroll/indemnity/calculate", data);

export const getIndemnities = (params = {}) =>
  apiClient.get("/payroll/indemnity", { params });

export const createIndemnity = (data) =>
  apiClient.post("/payroll/indemnity", data);

export const updateIndemnityStatus = (id, payload) => {
  const body = typeof payload === "object" ? payload : { action: payload };
  return apiClient.patch(`/payroll/indemnity/${id}/status`, body);
};

export const editAndResubmitIndemnity = (id, data) =>
  apiClient.patch(`/payroll/indemnity/${id}/edit-resubmit`, data);
