import { create } from 'zustand';
import type { DocumentView } from '../types';
import { documentApi } from '../api/documents';
import { useConversationStore } from './conversationStore';

interface DocumentState {
  documents: DocumentView[];
  isLoading: boolean;
  isUploading: boolean;
  uploadError: string | null;
  fetchDocuments: (conversationId?: string) => Promise<void>;
  uploadDocument: (file: File, conversationId?: string) => Promise<DocumentView>;
  deleteDocument: (id: string) => Promise<void>;
  retryDocument: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  isLoading: false,
  isUploading: false,
  uploadError: null,

  fetchDocuments: async (conversationId) => {
    set({ isLoading: true });
    try {
      const data = await documentApi.list(conversationId);
      set({ documents: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  uploadDocument: async (file, conversationId) => {
    set({ isUploading: true, uploadError: null });
    try {
      let targetConvId = conversationId;
      if (!targetConvId || targetConvId === 'new') {
        const newConv = await useConversationStore.getState().createConversation();
        targetConvId = newConv.conversationId;
      }

      let doc: DocumentView;
      try {
        doc = await documentApi.upload(file, targetConvId);
      } catch (firstErr: any) {
        // If the conversationId was stale/deleted on the server, create a fresh conversation and retry once
        if (firstErr.response?.status === 404) {
          const freshConv = await useConversationStore.getState().createConversation();
          doc = await documentApi.upload(file, freshConv.conversationId);
        } else {
          throw firstErr;
        }
      }

      set((state) => ({
        documents: [doc, ...state.documents.filter(d => d.documentId !== doc.documentId)],
        isUploading: false,
      }));
      return doc;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Upload failed.';
      set({ uploadError: msg, isUploading: false });
      throw err;
    }
  },

  deleteDocument: async (id) => {
    await documentApi.delete(id);
    set((state) => ({
      documents: state.documents.filter(d => d.documentId !== id)
    }));
  },

  retryDocument: async (id) => {
    const updated = await documentApi.retry(id);
    set((state) => ({
      documents: state.documents.map(d => d.documentId === id ? updated : d)
    }));
  },

  clearError: () => set({ uploadError: null })
}));
