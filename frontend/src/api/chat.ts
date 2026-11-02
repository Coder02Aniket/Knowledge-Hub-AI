import { apiFetch } from './client';
import type { MessageView } from '../types/api';

export const chatApi = {
  getHistory(conversationId: string): Promise<MessageView[]> {
    return apiFetch<MessageView[]>(`/api/chat/${encodeURIComponent(conversationId)}`, {
      method: 'GET',
    });
  },

  sendMessage(message: string, conversationId?: string | null): Promise<MessageView> {
    const query = conversationId
      ? `?conversationId=${encodeURIComponent(conversationId)}`
      : '';
    return apiFetch<MessageView>(`/api/chat${query}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
  },
};
