import apiClient from './apiClient';

const profileService = {
  // Update Profile Details 
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update profile' };
    }
  },

  // Upload Avatar
  uploadAvatar: async (formData) => {
    try {
      const response = await apiClient.post('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to upload avatar' };
    }
  },

  // Fetch Profile Details
  getProfile: async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch profile' };
    }
  },

  // Change Password
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to change password' };
    }
  }
};

export default profileService;