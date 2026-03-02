import apiClient from './apiClient';

const adminService = {
  getMetrics: async () =>
    await apiClient.get('/admin/metrics'),

  getUsers: async (params = {}) =>
    await apiClient.get('/admin/users', { params }),

  getAllEmployees: async (params = {}) =>
    await apiClient.get('/admin/users', { params }),

  getActivities: async (params = {}) =>
    await apiClient.get('/admin/activities', { params }),

  enrollUser: async (userData) =>
    await apiClient.post('/admin/enroll-user', userData),

  bulkUploadUsers: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await apiClient.post('/admin/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateUserStatus: async (userId, status) =>
    await apiClient.patch(`/admin/users/${userId}/status`, { status }),

  toggleUserStatus: async (userId) =>
    await apiClient.patch(`/admin/users/${userId}/toggle-status`),

  getUserDistribution: async () =>
    await apiClient.get('/admin/user-distribution'),

  getDepartmentStats: async () =>
    await apiClient.get('/admin/department-stats'),

  getSettings: async () =>
    await apiClient.get('/admin/settings'),

  updateSettings: async (settingsData) =>
    await apiClient.put('/admin/settings', settingsData),

  getAuditLogs: async () =>
    await apiClient.get('/audit'),

  getGoogleAuthUrl: async () =>
    await apiClient.get('/google/auth'),
};

export default adminService;
