import api from './apiClient';

export const performanceApi = {

  getStats: () => api.get('/performance/stats').then(r => r.data),

  getCycles: (status) => {
    const params = status ? { status } : {};
    return api.get('/performance/cycles', { params }).then(r => r.data);
  },

  getCycleById: (id) => api.get(`/performance/cycles/${id}`).then(r => r.data),

  createCycle: (data) => api.post('/performance/cycles', data).then(r => r.data),

  updateCycle: (id, data) => api.put(`/performance/cycles/${id}`, data).then(r => r.data),

  deleteCycle: (id) => api.delete(`/performance/cycles/${id}`).then(r => r.data),

};

export default performanceApi;
