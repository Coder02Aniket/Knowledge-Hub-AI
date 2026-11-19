import { api } from './client';
import type { Conversation, MessageView } from '../types';

export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const { data } = await api.get('/conversations');
    // Map backend `id` to `conversationId` for frontend consistency if needed
    return data.map((c: any) => ({
      ...c,
      conversationId: c.id,
    }));
  },

  createConversation: async (): Promise<Conversation> => {
    const { data } = await api.post('/conversations');
    return {
      ...data,
      conversationId: data.id,
    };
  },

  renameConversation: async (id: string, title: string): Promise<void> => {
    await api.put(`/conversations/${id}/title`, { title });
  },

  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/conversations/${id}`);
  },

  getMessages: async (conversationId: string): Promise<MessageView[]> => {
    const { data } = await api.get(`/chat/${conversationId}`);
    return data;
  },

  sendMessage: async (message: string, conversationId?: string): Promise<MessageView> => {
    const params = conversationId ? { conversationId } : {};
    const { data } = await api.post('/chat', { message }, { params });
    return data;
  },
};
