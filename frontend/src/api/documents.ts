import { API_BASE, apiFetch } from './client';
import type { DocumentView } from '../types/api';

export const documentsApi = {
  list(conversationId?: string | null): Promise<DocumentView[]> {
    const query = conversationId
      ? `?conversationId=${encodeURIComponent(conversationId)}`
      : '';
    return apiFetch<DocumentView[]>(`/api/documents${query}`, {
      method: 'GET',
    });
  },

  upload(file: File, conversationId: string): Promise<DocumentView> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    return apiFetch<DocumentView>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  retry(documentId: string): Promise<DocumentView> {
    return apiFetch<DocumentView>(`/api/documents/${encodeURIComponent(documentId)}/retry`, {
      method: 'POST',
    });
  },

  remove(documentId: string): Promise<void> {
    return apiFetch<void>(`/api/documents/${encodeURIComponent(documentId)}`, {
      method: 'DELETE',
    });
  },

  getDownloadUrl(documentId: string): string {
    return `${API_BASE}/api/documents/${encodeURIComponent(documentId)}/download`;
  },
};
