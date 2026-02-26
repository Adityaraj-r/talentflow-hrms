import axios from "axios";

const DEPT_URL = "http://localhost:5001/api/departments";
const USERS_URL = "http://localhost:5001/api/users";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getDepartments = async () => {
  const res = await axios.get(DEPT_URL, authHeader());
  return Array.isArray(res.data.data) ? res.data.data : [];
};

export const getDepartmentDetails = async (id) => {
  const [deptRes, usersRes] = await Promise.all([
    axios.get(`${DEPT_URL}/${id}`, authHeader()),
    axios.get(USERS_URL, authHeader()),
  ]);

  const department = deptRes.data.data;
  const allUsers = Array.isArray(usersRes.data.data)
    ? usersRes.data.data
    : Array.isArray(usersRes.data.users)
    ? usersRes.data.users
    : [];

  const employees = allUsers.filter((u) => u.department === department.name);

  return { department, employees };
};

export const getPotentialManagers = async () => {
  const res = await axios.get(USERS_URL, authHeader());
  return Array.isArray(res.data.data)
    ? res.data.data
    : Array.isArray(res.data.users)
    ? res.data.users
    : [];
};

export const addDepartment = async (payload) => {
  const res = await axios.post(DEPT_URL, payload, authHeader());
  return res.data;
};

export const updateDepartment = async (id, payload) => {
  const res = await axios.put(`${DEPT_URL}/${id}`, payload, authHeader());
  return res.data;
};

export const deleteDepartment = async (id) => {
  const res = await axios.delete(`${DEPT_URL}/${id}`, authHeader());
  return res.data;
};

export const assignManager = async (deptId, managerId) => {
  const res = await axios.put(
    `${DEPT_URL}/${deptId}`,
    { manager: managerId },
    authHeader()
  );
  return res.data;
};
