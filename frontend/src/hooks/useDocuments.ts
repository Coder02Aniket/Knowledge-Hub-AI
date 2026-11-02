import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../api/documents';
import { useToast } from '../components/ui/ToastProvider';
import type { DocumentStatus, DocumentView } from '../types/api';

export const POLL_INTERVAL_MS = 2500;

export function hasActiveIngestion(docs: DocumentView[] | undefined): boolean {
  if (!docs || docs.length === 0) return false;
  return docs.some((d) => d.status === 'PENDING' || d.status === 'PROCESSING');
}

export function useDocuments(conversationId?: string | null, enabled = true) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const prevStatusMapRef = useRef<Map<string, DocumentStatus>>(new Map());

  const queryKey = conversationId ? ['documents', conversationId] : ['documents', 'all'];

  const listQuery = useQuery({
    queryKey,
    queryFn: () => documentsApi.list(conversationId),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data as DocumentView[] | undefined;
      return hasActiveIngestion(data) ? POLL_INTERVAL_MS : false;
    },
  });

  // Reset tracked status map when switching conversations
  useEffect(() => {
    prevStatusMapRef.current = new Map();
  }, [conversationId]);

  // Detect background ingestion transitions (PENDING/PROCESSING -> COMPLETED/FAILED)
  useEffect(() => {
    const docs = listQuery.data;
    if (!docs) return;

    const prevMap = prevStatusMapRef.current;
    for (const doc of docs) {
      const prevStatus = prevMap.get(doc.documentId);
      if (
        (prevStatus === 'PENDING' || prevStatus === 'PROCESSING') &&
        doc.status === 'COMPLETED'
      ) {
        pushToast({
          variant: 'success',
          title: `${doc.fileName} indexed in Vault`,
          description: `${doc.chunkCount ?? 0} vector chunks ready for grounded citations.`,
        });
      } else if (
        (prevStatus === 'PENDING' || prevStatus === 'PROCESSING') &&
        doc.status === 'FAILED'
      ) {
        pushToast({
          variant: 'error',
          title: `Failed to index ${doc.fileName}`,
          description: doc.processingError || 'Document ingestion encountered an error.',
        });
      }
      prevMap.set(doc.documentId, doc.status);
    }
  }, [listQuery.data, pushToast]);

  const uploadMutation = useMutation({
    mutationFn: ({ file, targetConversationId }: { file: File; targetConversationId: string }) =>
      documentsApi.upload(file, targetConversationId),
    onSuccess: (uploaded, { targetConversationId }) => {
      prevStatusMapRef.current.set(uploaded.documentId, uploaded.status);
      queryClient.setQueryData<DocumentView[]>(
        ['documents', targetConversationId],
        (old = []) => [uploaded, ...old.filter((d) => d.documentId !== uploaded.documentId)]
      );
      queryClient.invalidateQueries({ queryKey: ['documents', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: (documentId: string) => documentsApi.retry(documentId),
    onSuccess: (updated) => {
      prevStatusMapRef.current.set(updated.documentId, updated.status);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      pushToast({
        variant: 'info',
        title: `Re-queued ${updated.fileName}`,
        description: 'Document ingestion restarted.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => documentsApi.remove(documentId),
    onSuccess: (_, documentId) => {
      prevStatusMapRef.current.delete(documentId);
      queryClient.setQueryData<DocumentView[]>(queryKey, (old = []) =>
        old.filter((d) => d.documentId !== documentId)
      );
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const documents = listQuery.data ?? [];
  const completedCount = documents.filter((d) => d.status === 'COMPLETED').length;
  const processingCount = documents.filter(
    (d) => d.status === 'PENDING' || d.status === 'PROCESSING'
  ).length;

  return {
    documents,
    completedCount,
    processingCount,
    isPolling: hasActiveIngestion(documents),
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    retryDocument: retryMutation.mutateAsync,
    isRetrying: retryMutation.isPending,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
