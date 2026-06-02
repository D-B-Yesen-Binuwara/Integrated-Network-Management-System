import apiClient from './apiClient';

class ChatService {
  async sendMessage(message) {
    try {
      const response = await apiClient.post('/chat', { message }, { timeout: 120000 });
      return response.data;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }
}

export default new ChatService();
