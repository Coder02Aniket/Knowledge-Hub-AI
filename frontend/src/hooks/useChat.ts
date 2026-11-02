import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat';
import { conversationsApi } from '../api/conversations';
import { CONVERSATIONS_QUERY_KEY } from './useConversations';
import { deriveTitleFromPrompt } from '../utils/formatters';
import type { ConversationView, MessageView } from '../types/api';

export function useChat(conversationId: string | null) {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ['chat', conversationId],
    queryFn: () => chatApi.getHistory(conversationId!),
    enabled: Boolean(conversationId),
  });

  const sendMutation = useMutation({
    mutationFn: async ({
      message,
      targetConversationId,
    }: {
      message: string;
      targetConversationId?: string | null;
    }): Promise<{ reply: MessageView; resolvedConversationId: string }> => {
      let activeConvId = targetConversationId ?? conversationId;
      let shouldAutoRename = false;

      if (!activeConvId) {
        const created = await conversationsApi.create();
        activeConvId = created.id;
        shouldAutoRename = true;
        queryClient.setQueryData<ConversationView[]>(CONVERSATIONS_QUERY_KEY, (old = []) => [
          created,
          ...old,
        ]);
      } else {
        const existingList =
          queryClient.getQueryData<ConversationView[]>(CONVERSATIONS_QUERY_KEY) ?? [];
        const found = existingList.find((c) => c.id === activeConvId);
        const existingMsgs =
          queryClient.getQueryData<MessageView[]>(['chat', activeConvId]) ?? [];
        if (found && found.title === 'New conversation' && existingMsgs.length === 0) {
          shouldAutoRename = true;
        }
      }

      const optimisticUserMsg: MessageView = {
        messageId: `optimistic-${Date.now()}`,
        role: 'USER',
        content: message,
        sentAt: new Date().toISOString(),
        failed: false,
        failureReason: null,
        sources: [],
      };

      queryClient.setQueryData<MessageView[]>(['chat', activeConvId], (old = []) => [
        ...old,
        optimisticUserMsg,
      ]);

      if (shouldAutoRename) {
        const newTitle = deriveTitleFromPrompt(message);
        conversationsApi.rename(activeConvId, newTitle).catch(() => {});
        queryClient.setQueryData<ConversationView[]>(CONVERSATIONS_QUERY_KEY, (old = []) =>
          old.map((c) => (c.id === activeConvId ? { ...c, title: newTitle } : c))
        );
      }

      const reply = await chatApi.sendMessage(message, activeConvId);
      return { reply, resolvedConversationId: activeConvId };
    },
    onSuccess: ({ reply, resolvedConversationId }) => {
      queryClient.setQueryData<MessageView[]>(['chat', resolvedConversationId], (old = []) => [
        ...old,
        reply,
      ]);
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
    onError: (err, variables) => {
      const targetId = variables.targetConversationId ?? conversationId;
      if (targetId) {
        const errorMsg: MessageView = {
          messageId: `err-${Date.now()}`,
          role: 'ASSISTANT',
          content: '',
          sentAt: new Date().toISOString(),
          failed: true,
          failureReason: err instanceof Error ? err.message : 'Unable to complete chat request.',
          sources: [],
        };
        queryClient.setQueryData<MessageView[]>(['chat', targetId], (old = []) => [
          ...old,
          errorMsg,
        ]);
      }
    },
  });

  return {
    messages: historyQuery.data ?? [],
    isLoadingHistory: historyQuery.isLoading,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    refetchHistory: historyQuery.refetch,
  };
}
