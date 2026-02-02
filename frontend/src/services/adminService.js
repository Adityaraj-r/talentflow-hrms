import axios from 'axios';

// 1. Configuration using Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Axios Instance Configuration for the Cloned Repo
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Automatically attaches the token for Admin requests
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

// Interceptor: Centralized error handling and session management
apiClient.interceptors.response.use(
  (response) => response.data, 
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('idToken');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || { message: error.message });
  }
);

/**
 * Integrated Admin Service
 */
const adminService = {
  // Get dashboard metrics
  getMetrics: async () => {
    return await apiClient.get('/admin/metrics');
  },

  // Get users - Mapped to /admin/users to match current backend structure
  getUsers: async (params = {}) => {
    return await apiClient.get('/admin/users', { params });
  },

  // Get system logs/activities
  getActivities: async (params = {}) => {
    return await apiClient.get('/admin/activities', { params });
  },

  // Enroll new employee
  enrollUser: async (userData) => {
    return await apiClient.post('/admin/enroll-user', userData);
  },

  // Bulk upload via CSV
  bulkUploadUsers: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await apiClient.post('/admin/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Update status (Active/Inactive)
  updateUserStatus: async (userId, status) => {
    return await apiClient.patch(`/admin/users/${userId}/status`, { status });
  },

  // Change status (Toggle)
  toggleUserStatus: async (userId) => {
    return await apiClient.patch(`/admin/users/${userId}/toggle-status`);
  },

  // Data for Chart widgets
  getUserDistribution: async () => {
    return await apiClient.get('/admin/user-distribution');
  },

<<<<<<< Updated upstream
  /**
   * Toggle user status (Active/Inactive)
   */
  toggleUserStatus: async (userId) => {
    return await apiClient.patch(`/admin/users/${userId}/toggle-status`);
=======
  // Data for Department widgets
  getDepartmentStats: async () => {
    return await apiClient.get('/admin/department-stats');
>>>>>>> Stashed changes
  },

  /**
   * ATTENDANCE ADDITION: Get all attendance records for Admin View
   * This connects the attendance controller logic to the Admin Dashboard
   */
<<<<<<< Updated upstream
  getDepartmentStats: async () => {
    try {
      return await apiClient.get('/admin/department-stats');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get system settings
   */
  getSettings: async () => {
    try {
      return await apiClient.get('/admin/settings');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update system settings
   */
  updateSettings: async (settingsData) => {
    try {
      return await apiClient.put('/admin/settings', settingsData);
    } catch (error) {
      throw error;
    }
  },
};

export default adminService;
=======
  getAllAttendance: async (params = {}) => {
    return await apiClient.get('/attendance/all', { params });
  }
};

export default adminService;
>>>>>>> Stashed changes
