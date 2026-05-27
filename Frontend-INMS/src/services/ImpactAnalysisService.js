import apiClient from './apiClient';

class ImpactAnalysisService {
  static async analyze(deviceId) {
    const response = await apiClient.post(`/impact-analysis/analyze/${deviceId}`);
    return response.data;
  }

  static async getResult(deviceId) {
    const response = await apiClient.get(`/impact-analysis/result/${deviceId}`);
    return response.data;
  }

  static async clear(deviceId) {
    const response = await apiClient.post(`/impact-analysis/clear/${deviceId}`);
    return response.data;
  }
}

export default ImpactAnalysisService;
