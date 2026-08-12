import apiClient from './apiClient';

const meetingService = {
  createMeeting: async (meetingData) => {
    try {
      const response = await apiClient.post('/api/meetings', meetingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getMeetings: async () => {
    try {
      const response = await apiClient.get('/api/meetings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateMeeting: async (id, meetingData) => {
    try {
      const response = await apiClient.put(`/api/meetings/${id}`, meetingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteMeeting: async (id) => {
    try {
      const response = await apiClient.delete(`/api/meetings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default meetingService;
