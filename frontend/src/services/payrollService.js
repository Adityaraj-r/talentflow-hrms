import apiClient from "./apiClient";

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

export const getSalarySlip = (payrollId, employeeId) =>
  apiClient.get(`/payroll/${payrollId}/slip/${employeeId}`);

export const downloadPayslip = (payrollId, employeeId) =>
  apiClient.get(`/payroll/${payrollId}/download/${employeeId}`, {
    responseType: "blob",
  });

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

export const updateIndemnityStatus = (id, status) =>
  apiClient.patch(`/payroll/indemnity/${id}/status`, { status });
