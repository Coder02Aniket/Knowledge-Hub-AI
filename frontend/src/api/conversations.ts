import { apiFetch } from './client';
import type { ConversationView } from '../types/api';

export const conversationsApi = {
  list(): Promise<ConversationView[]> {
    return apiFetch<ConversationView[]>('/api/conversations', {
      method: 'GET',
    });
  },

  create(): Promise<ConversationView> {
    return apiFetch<ConversationView>('/api/conversations', {
      method: 'POST',
    });
  },

  rename(id: string, title: string): Promise<void> {
    return apiFetch<void>(`/api/conversations/${encodeURIComponent(id)}/title`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/api/conversations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
