import api from './apiClient';

export const performanceApi = {

  getStats: () => api.get('/performance/stats'),

  getCycles: (status) => {
    const params = status ? { status } : {};
    return api.get('/performance/cycles', { params });
  },

  getCycleById: (id) => api.get(`/performance/cycles/${id}`),

  createCycle: (data) => api.post('/performance/cycles', data),

  updateCycle: (id, data) => api.put(`/performance/cycles/${id}`, data),

  deleteCycle: (id) => api.delete(`/performance/cycles/${id}`),

};

export default performanceApi;
