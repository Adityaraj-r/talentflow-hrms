import apiClient from "./apiClient"; /*comment */

export const getDisciplinaryCases = (params = {}) =>
  apiClient.get("/disciplinary", { params });

export const getDisciplinaryCase = (id) => apiClient.get(`/disciplinary/${id}`);

export const getDisciplinaryEmployees = () =>
  apiClient.get("/disciplinary/employees/eligible");

export const createDisciplinaryCase = (payload) =>
  apiClient.post("/disciplinary", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateDisciplinaryCase = (id, payload) =>
  apiClient.put(`/disciplinary/${id}`, payload);

export const updateDisciplinaryStatus = (id, status) =>
  apiClient.patch(`/disciplinary/${id}/status`, { status });

export const getEmployee = (id) => apiClient.get(`/employees/${id}`);
