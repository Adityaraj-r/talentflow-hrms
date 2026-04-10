import apiClient from './apiClient';

const googleMeetService = {
  createMeeting: async (meetingData) => {
    return await apiClient.post('/google/create-meet', meetingData);
  },
  getStatus: async () => {
    return await apiClient.get('/google/status');
  },

  getUpcomingMeetings: async () => {
    return await apiClient.get('/google/list-meetings');
  }
};

export default googleMeetService;