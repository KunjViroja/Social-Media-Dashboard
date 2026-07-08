import api from './api'

const messageService = {
  getConversations: () => api.get('/messages/conversations'),
  getOrCreateConversation: (recipientId) => api.post('/messages/conversations', { recipientId }),
  getMessages: (conversationId, params) => api.get(`/messages/conversations/${conversationId}`, { params }),
  sendMessage: (conversationId, formData) => api.post(`/messages/conversations/${conversationId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

export default messageService
