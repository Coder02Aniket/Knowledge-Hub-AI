import { api } from './client';
import type { DocumentView } from '../types';

export const documentApi = {
  upload: async (file: File, conversationId: string): Promise<DocumentView> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    const { data } = await api.post('/documents/upload', formData);
    return data;
  },

  list: async (conversationId?: string): Promise<DocumentView[]> => {
    const params = conversationId ? { conversationId } : {};
    const { data } = await api.get('/documents', { params });
    return data;
  },

  delete: async (documentId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`);
  },

  retry: async (documentId: string): Promise<DocumentView> => {
    const { data } = await api.post(`/documents/${documentId}/retry`);
    return data;
  },

  download: (documentId: string): void => {
    window.location.href = `/knowledgehub/api/documents/${documentId}/download`;
  },
};
