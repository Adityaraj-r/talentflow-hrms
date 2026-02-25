import axios from 'axios';

const API_URL = 'http://localhost:5001/api/departments';
const USERS_API_URL = 'http://localhost:5001/api/users';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getDepartments = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeader());
    return response.data.departments;
  } catch (error) {
    throw error.response?.data?.message || "Failed to fetch departments";
  }
};

export const getDepartmentDetails = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to fetch details";
  }
};

export const getPotentialManagers = async () => {
  try {
    const response = await axios.get(USERS_API_URL, getAuthHeader());
    return response.data.users || [];
  } catch (error) {
    console.error("Failed to fetch manager list", error);
    return [];
  }
};

export const addDepartment = async (departmentData) => {
  try {
    const response = await axios.post(API_URL, departmentData, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to add department";
  }
};

export const updateDepartment = async (id, departmentData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, departmentData, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to update department";
  }
};

export const deleteDepartment = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to delete department";
  }
};

export const assignManager = async (deptId, managerId) => {
  try {
    const response = await axios.put(
      `${API_URL}/${deptId}/assign-manager`, 
      { managerId }, 
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to assign manager";
  }
};