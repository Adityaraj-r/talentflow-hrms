import api from './apiClient';

export const performanceApi = {

  getStats: () => api.get('/performance/stats'),

  getAnalyticsSummary: () => api.get('/performance/analytics-summary'),

  getDashboardAnalytics: () => api.get('/performance/dashboard-analytics'),

  getCycles: (status) => {
    const params = status ? { status } : {};
    return api.get('/performance/cycles', { params });
  },
  getEmployeeOverview: () =>
    api.get("/performance/employee-overview"),

  getCycleById: (id) => api.get(`/performance/cycles/${id}`),

  createCycle: (data) => api.post('/performance/cycles', data),

  updateCycle: (id, data) => api.put(`/performance/cycles/${id}`, data),

  deleteCycle: (id) => api.delete(`/performance/cycles/${id}`),

  /** Goals CRUD — same paths as backend goalRoutes mounted at /api/performance/goals */
  getMyGoals: () => api.get('/performance/goals/my-goals'),

  getTeamGoals: () => api.get('/performance/goals/team-goals'),

  createGoal: (data) => api.post('/performance/goals', data),

  updateGoal: (id, data) => api.put(`/performance/goals/${id}`, data),

  deleteGoal: (id) => api.delete(`/performance/goals/${id}`),
};

export default performanceApi;
