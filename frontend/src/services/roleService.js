import apiClient from './apiClient';

export const getRoles = async () => {
  try {
    const response = await apiClient.get('/roles');
    
    if (response.success) {          
      return response.roles || response.data || [];        
    } else if (Array.isArray(response)) {
      return response; 
    }
    return [];
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

export const updateRole = async (id, roleData) => {
  try {
    const response = await apiClient.put(`/roles/${id}`, roleData);
    return response; 
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
};

export const createRole = async (roleName) => {
  try {
    const response = await apiClient.post('/roles', { name: roleName });
    return response; 
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

export const deleteRole = async (id) => {
  try {
    const response = await apiClient.delete(`/roles/${id}`);
    return response;
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
};
