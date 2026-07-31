import apiClient from "./apiClient";

export const getDepartments = async () => {
  const res = await apiClient.get("/departments");
  return Array.isArray(res.data) ? res.data : [];
};

export const getDepartmentDetails = async (id) => {
  const [deptRes, usersRes] = await Promise.all([
    apiClient.get(`/departments/${id}`),
    apiClient.get("/users"),
  ]);

  const department = deptRes.data;
  const allUsers = Array.isArray(usersRes.data)
    ? usersRes.data
    : Array.isArray(usersRes.users)
    ? usersRes.users
    : [];

  const employees = allUsers.filter((u) => u.department === department.name);

  return { department, employees };
};

export const getPotentialManagers = async () => {
  const res = await apiClient.get("/users");
  return Array.isArray(res.data)
    ? res.data
    : Array.isArray(res.users)
    ? res.users
    : [];
};

export const addDepartment = async (payload) => {
  const res = await apiClient.post("/departments", payload);
  return res;
};

export const updateDepartment = async (id, payload) => {
  const res = await apiClient.put(`/departments/${id}`, payload);
  return res;
};

export const deleteDepartment = async (id) => {
  const res = await apiClient.delete(`/departments/${id}`);
  return res;
};

export const assignManager = async (deptId, managerId) => {
  const res = await apiClient.put(`/departments/${deptId}`, { manager: managerId });
  return res;
};
