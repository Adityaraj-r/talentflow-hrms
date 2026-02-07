import axios from 'axios';

const API_URL = 'http://localhost:5001/api/roles';

export const getRoles = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}` // Send token if auth is needed
      }
    });
    if (response.data.success) {
      return response.data.roles;
    }
    return [];
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

// 2. Update a Role (Save Permissions)
export const updateRole = async (id, roleData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, roleData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
};

// 3. Create New Role
export const createRole = async (roleName) => {
  try {
    const response = await axios.post(API_URL, { name: roleName }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

// 4. Delete Role
export const deleteRole = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
};