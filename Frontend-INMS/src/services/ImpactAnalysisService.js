import apiClient from './apiClient';

class ImpactAnalysisService {
  static async getImpactResult(deviceId) {
    const response = await apiClient.get(`/impact-analysis/analyze/${deviceId}`);
    return response.data;
  }

  static async analyzeDeviceFailure(deviceId) {
    const response = await apiClient.post(`/impact-analysis/simulate-failure/${deviceId}`);
    return response.data;
  }

  static async clearDeviceImpact(deviceId) {
    const response = await apiClient.post(`/impact-analysis/clear-failure/${deviceId}`);
    return response.data;
  }

  static async analyze(deviceId) {
    return this.analyzeDeviceFailure(deviceId);
  }

  static async getResult(deviceId) {
    return this.getImpactResult(deviceId);
  }

  static async clear(deviceId) {
    return this.clearDeviceImpact(deviceId);
  }
}

export default ImpactAnalysisService;
