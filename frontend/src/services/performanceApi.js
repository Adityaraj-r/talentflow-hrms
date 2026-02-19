import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api/performance';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Performance API Methods
export const performanceApi = {
  // Get dashboard stats
  getStats: async () => {
    const response = await apiClient.get('/stats');
    return response.data;
  },

  // Get all cycles
  getCycles: async (status) => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/cycles', { params });
    return response.data;
  },

  // Get single cycle by ID
  getCycleById: async (id) => {
    const response = await apiClient.get(`/cycles/${id}`);
    return response.data;
  },

  // Create new cycle
  createCycle: async (cycleData) => {
    const response = await apiClient.post('/cycles', cycleData);
    return response.data;
  },

  // Update cycle
  updateCycle: async (id, cycleData) => {
    const response = await apiClient.put(`/cycles/${id}`, cycleData);
    return response.data;
  },

  // Delete cycle
  deleteCycle: async (id) => {
    const response = await apiClient.delete(`/cycles/${id}`);
    return response.data;
  }
};

export default performanceApi;
