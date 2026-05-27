import apiClient from './apiClient';

/**
 * Device Service - handles all device-related API calls
 */
class DeviceService {
  /**
   * Get all devices
   * @returns {Promise<Array>}
   */
  static async getAll() {
    try {
      const response = await apiClient.get('/device');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all devices:', error);
      throw error;
    }
  }

  /**
   * Get device by ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  static async getById(id) {
    try {
      const response = await apiClient.get(`/device/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch device ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get visible devices for a user
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  static async getVisibleDevices(userId) {
    try {
      const response = await apiClient.get(`/device/visible/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch visible devices for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get devices for map with coordinates
   * @returns {Promise<Array>}
   */
  static async getDevicesForMap() {
    try {
      const response = await apiClient.get('/device/map');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch devices for map:', error);
      throw error;
    }
  }

  /**
   * Create a new device
   * @param {Object} device
   * @returns {Promise<Object>}
   */
  static async create(device) {
    try {
      const response = await apiClient.post('/device', device);
      return response.data;
    } catch (error) {
      console.error('Failed to create device:', error);
      throw error;
    }
  }

  /**
   * Update a device
   * @param {number} id
   * @param {Object} device
   * @returns {Promise<Object>}
   */
  static async update(id, device) {
    try {
      const response = await apiClient.put(`/device/${id}`, device);
      return response.data;
    } catch (error) {
      console.error(`Failed to update device ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a device
   * @param {number} id
   * @returns {Promise<void>}
   */
  static async delete(id) {
    try {
      await apiClient.delete(`/device/${id}`);
    } catch (error) {
      console.error(`Failed to delete device ${id}:`, error);
      throw error;
    }
  }

  /**
   * Assign a device to a user
   * @param {number} id
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  static async assignUser(id, userId) {
    try {
      const response = await apiClient.patch(`/device/${id}/assign`, { UserId: Number(userId) });
      return response.data;
    } catch (error) {
      console.error(`Failed to assign device ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update device status
   * @param {number} id
   * @param {string} status
   * @returns {Promise<Object>}
   */
  static async updateStatus(id, status) {
    try {
      const response = await apiClient.patch(`/device/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Failed to update status for device ${id}:`, error);
      throw error;
    }
  }

  /**
   * Trigger simulated failure for a device
   * @param {number} id
   * @returns {Promise<Object>}
   */
  static async simulateFailure(id) {
    try {
      const response = await apiClient.post(`/device/${id}/simulate-failure`);
      return response.data;
    } catch (error) {
      console.error(`Failed to simulate failure for device ${id}:`, error);
      throw error;
    }
  }

  /**
   * Recover a simulated device back to normal heartbeat behavior
   * @param {number} id
   * @returns {Promise<Object>}
   */
  static async recover(id) {
    try {
      const response = await apiClient.post(`/device/${id}/recover`);
      return response.data;
    } catch (error) {
      console.error(`Failed to recover device ${id}:`, error);
      throw error;
    }
  }

}


export default DeviceService;
