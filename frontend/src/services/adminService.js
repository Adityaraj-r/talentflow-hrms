import axios from 'axios';

// Use Vite environment variables (VITE_ prefix)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Axios Instance Configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('idToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response) => response.data, // Directly return data property
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('idToken');
      window.location.href = '/login';
    }
    // Return a consistent error object
    return Promise.reject(error.response?.data || { message: error.message });
  }
);

/**
 * Admin Service
 */
const adminService = {
  /**
   * Get admin dashboard metrics (Total users, active, pending, etc.)
   */
  getMetrics: async () => {
    try {
      return await apiClient.get('/admin/metrics');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get full list of users with filtering/pagination
   * @param {Object} params - { page, limit, role, search, status }
   */
  getUsers: async (params = {}) => {
    try {
      return await apiClient.get('/admin/users', { params });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get recent system activities/logs
   */
  getActivities: async (params = {}) => {
    try {
      return await apiClient.get('/admin/activities', { params });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Enroll a new user into the system (POST /admin/enroll-user)
   */
  enrollUser: async (userData) => {
    try {
      return await apiClient.post('/admin/enroll-user', userData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Bulk upload users via CSV/Excel
   * @param {File} file - The file object from input
   */
  bulkUploadUsers: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      return await apiClient.post('/admin/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user status (Active/Inactive/Deactivated)
   */
  updateUserStatus: async (userId, status) => {
    try {
      return await apiClient.patch(`/admin/users/${userId}/status`, { status });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user distribution by role for charts
   */
  getUserDistribution: async () => {
    try {
      return await apiClient.get('/admin/user-distribution');
    } catch (error) {
      throw error;
    }
  },

  // adminService.js
toggleUserStatus: async (userId) => {
  return await apiClient.patch(`/admin/users/${userId}/toggle-status`);
},

  /**
   * Get department statistics
   */
  getDepartmentStats: async () => {
    try {
      return await apiClient.get('/admin/department-stats');
    } catch (error) {
      throw error;
    }
  }
};


export default adminService;