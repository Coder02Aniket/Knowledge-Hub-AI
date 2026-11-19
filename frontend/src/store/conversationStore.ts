import { create } from 'zustand';
import type { Conversation, MessageView } from '../types';
import { chatApi } from '../api/chat';

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: MessageView[];
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  fetchConversations: () => Promise<void>;
  createConversation: () => Promise<Conversation>;
  setActiveConversation: (id: string | null) => void;
  fetchMessages: (id: string) => Promise<void>;
  sendMessage: (message: string) => Promise<string | null>;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isLoadingMessages: false,
  isSending: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const data = await chatApi.getConversations();
      set({ conversations: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createConversation: async () => {
    const data = await chatApi.createConversation();
    set((state) => ({
      conversations: [data, ...state.conversations.filter(c => c.conversationId !== data.conversationId)],
      activeConversationId: data.conversationId,
      messages: [],
    }));
    return data;
  },

  setActiveConversation: (id) => {
    const currentId = get().activeConversationId;
    if (id === currentId) {
      return;
    }
    set({ activeConversationId: id, messages: [] });
    if (id) {
      get().fetchMessages(id);
    }
  },

  fetchMessages: async (id) => {
    set({ isLoadingMessages: true });
    try {
      const messages = await chatApi.getMessages(id);
      set({ messages, isLoadingMessages: false });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (message) => {
    const { activeConversationId } = get();
    set({ isSending: true });
    
    // Optimistic UI for user message
    const tempMessage: MessageView = {
      messageId: `temp-${Date.now()}`,
      role: 'USER',
      content: message,
      sentAt: new Date().toISOString(),
      failed: false,
      sources: []
    };
    
    set((state) => ({
      messages: [...state.messages, tempMessage]
    }));

    try {
      const responseMsg = await chatApi.sendMessage(message, activeConversationId || undefined);
      
      if (!activeConversationId) {
        await get().fetchConversations();
        const newConversations = get().conversations;
        if (newConversations.length > 0) {
          const newId = newConversations[0].conversationId;
          set({ activeConversationId: newId });
          await get().fetchMessages(newId);
          set({ isSending: false });
          return newId;
        }
      }
      
      set((state) => ({
        messages: state.messages
          .map(m => m.messageId === tempMessage.messageId ? { ...m, messageId: `user-${Date.now()}` } : m)
          .concat(responseMsg),
        isSending: false,
      }));
      return activeConversationId;
    } catch {
      set((state) => ({
        messages: state.messages.filter(m => m.messageId !== tempMessage.messageId),
        isSending: false,
      }));
      return activeConversationId;
    }
  },

  renameConversation: async (id, title) => {
    await chatApi.renameConversation(id, title);
    set((state) => ({
      conversations: state.conversations.map(c => 
        c.conversationId === id ? { ...c, title } : c
      )
    }));
  },

  deleteConversation: async (id) => {
    await chatApi.deleteConversation(id);
    set((state) => ({
      conversations: state.conversations.filter(c => c.conversationId !== id),
      activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
      messages: state.activeConversationId === id ? [] : state.messages,
    }));
  }
}));
