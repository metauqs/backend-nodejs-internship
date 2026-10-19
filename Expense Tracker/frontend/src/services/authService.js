import api from './api';

export const authService = {
  /**
   * Log in user
   * @param {Object} credentials { email, password }
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new user
   * @param {Object} userData { name, email, password }
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Log out user
   */
  async logout() {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch {
      // Allow local logout even if server endpoint fails
      return { success: true };
    }
  },

  /**
   * Get current authenticated user profile
   */
  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} profileData
   */
  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  /**
   * Upload user profile avatar to Cloudinary
   * @param {File} file
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Remove user profile avatar from Cloudinary
   */
  async removeAvatar() {
    const response = await api.delete('/auth/profile/avatar');
    return response.data;
  },
};

export default authService;
