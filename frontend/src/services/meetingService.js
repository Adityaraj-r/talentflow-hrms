import apiClient from './apiClient';

const meetingService = {
  createMeeting: async (meetingData) => {
    try {
      const response = await apiClient.post('/meetings', meetingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getMeetings: async () => {
    try {
      const response = await apiClient.get('/meetings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateMeeting: async (id, meetingData) => {
    try {
      const response = await apiClient.put(`/meetings/${id}`, meetingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteMeeting: async (id) => {
    try {
      const response = await apiClient.delete(`/meetings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default meetingService;
