import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations';
import type { ConversationView } from '../types/api';

export const CONVERSATIONS_QUERY_KEY = ['conversations'] as const;

export function useConversations(enabled = true) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: () => conversationsApi.list(),
    enabled,
  });

  const createMutation = useMutation({
    mutationFn: () => conversationsApi.create(),
    onSuccess: (created) => {
      queryClient.setQueryData<ConversationView[]>(CONVERSATIONS_QUERY_KEY, (old = []) => [
        created,
        ...old.filter((c) => c.id !== created.id),
      ]);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      conversationsApi.rename(id, title),
    onSuccess: (_, { id, title }) => {
      queryClient.setQueryData<ConversationView[]>(CONVERSATIONS_QUERY_KEY, (old = []) =>
        old.map((c) => (c.id === id ? { ...c, title } : c))
      );
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => conversationsApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<ConversationView[]>(CONVERSATIONS_QUERY_KEY, (old = []) =>
        old.filter((c) => c.id !== id)
      );
      queryClient.removeQueries({ queryKey: ['chat', id] });
      queryClient.removeQueries({ queryKey: ['documents', id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    conversations: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    createConversation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    renameConversation: renameMutation.mutateAsync,
    isRenaming: renameMutation.isPending,
    deleteConversation: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
