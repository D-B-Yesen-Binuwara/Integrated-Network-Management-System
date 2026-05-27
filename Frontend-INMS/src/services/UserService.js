import apiClient from './apiClient';

/**
 * User Service - handles user-related API calls
 */
class UserService {
  /**
   * Get all users
   * @returns {Promise<Array>}
   */
  static async getAll() {
    try {
      const response = await apiClient.get('/user');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData 
   * @returns {Promise}
   */
  static async create(userData) {
    try {
      const response = await apiClient.post('/user', userData);
      return response.data;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Update an existing user
   * @param {number} id 
   * @param {Object} userData 
   * @returns {Promise}
   */
  static async update(id, userData) {
    try {
      const response = await apiClient.put(`/user/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   * @param {number} id 
   * @returns {Promise}
   */
  static async delete(id) {
    try {
      const response = await apiClient.delete(`/user/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }
}

export default UserService;
