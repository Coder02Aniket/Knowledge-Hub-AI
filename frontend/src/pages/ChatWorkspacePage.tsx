import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { MessageList } from '../components/chat/MessageList';
import { ChatComposer } from '../components/chat/ChatComposer';
import { SourceInspectorDrawer } from '../components/chat/SourceInspectorDrawer';
import { VaultDrawer } from '../components/vault/VaultDrawer';
import { useConversations } from '../hooks/useConversations';
import { useChat } from '../hooks/useChat';
import { useDocuments } from '../hooks/useDocuments';
import { useToast } from '../components/ui/ToastProvider';
import type { ActiveCitationSelection, SourceView } from '../types/api';

interface ChatWorkspacePageProps {
  activeConversationId: string | null;
  onOpenMobileSidebar: () => void;
}

export function ChatWorkspacePage({
  activeConversationId,
  onOpenMobileSidebar,
}: ChatWorkspacePageProps) {
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const {
    conversations,
    createConversation,
    renameConversation,
  } = useConversations(true);

  const {
    messages,
    isLoadingHistory,
    sendMessage,
    isSending,
  } = useChat(activeConversationId);

  const {
    documents,
    completedCount,
    processingCount,
    isPolling,
    isLoading: isLoadingDocs,
    uploadDocument,
    isUploading,
    retryDocument,
    isRetrying,
    deleteDocument,
    isDeleting: isDeletingDoc,
  } = useDocuments(activeConversationId, Boolean(activeConversationId));

  const [composerText, setComposerText] = useState('');
  const [vaultDrawerOpen, setVaultDrawerOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<ActiveCitationSelection | null>(null);

  // Close citation inspector when switching conversations
  useEffect(() => {
    setActiveCitation(null);
  }, [activeConversationId]);

  const currentConversation = conversations.find((c) => c.id === activeConversationId);
  const currentTitle = activeConversationId
    ? currentConversation?.title || 'Research Session'
    : 'New Research Session';

  const handleSend = async (text: string) => {
    setComposerText('');
    const result = await sendMessage({
      message: text,
      targetConversationId: activeConversationId,
    });
    if (!activeConversationId && result.resolvedConversationId) {
      navigate(`/c/${result.resolvedConversationId}`, { replace: true });
    }
  };

  // Supports Upload-First workflow: if conversationId is null, auto-create conversation first!
  const handleUploadFile = async (file: File) => {
    let targetConvId = activeConversationId;
    if (!targetConvId) {
      const created = await createConversation();
      targetConvId = created.id;
      navigate(`/c/${created.id}`);
    }
    const uploaded = await uploadDocument({
      file,
      targetConversationId: targetConvId,
    });
    setVaultDrawerOpen(true);
    pushToast({
      variant: 'info',
      title: `Uploaded ${uploaded.fileName}`,
      description: 'Chunking and generating vector embeddings in background...',
    });
  };

  const handleSelectCitation = (
    messageId: string,
    citationIndex: number,
    source: SourceView,
    allSources: SourceView[]
  ) => {
    setVaultDrawerOpen(false);
    setActiveCitation({
      messageId,
      citationIndex,
      source,
      allSources,
    });
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <TopBar
        title={currentTitle}
        canRename={Boolean(activeConversationId)}
        onRename={
          activeConversationId
            ? (newTitle) => renameConversation({ id: activeConversationId, title: newTitle })
            : undefined
        }
        completedDocsCount={completedCount}
        totalDocsCount={documents.length}
        isVaultOpen={vaultDrawerOpen}
        onToggleVault={() => {
          setActiveCitation(null);
          setVaultDrawerOpen((prev) => !prev);
        }}
        hasActiveCitation={Boolean(activeCitation)}
        onOpenMobileSidebar={onOpenMobileSidebar}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
          <MessageList
            messages={messages}
            documents={documents}
            isLoadingHistory={isLoadingHistory}
            isSending={isSending}
            isUploading={isUploading}
            activeCitation={activeCitation}
            onSelectCitation={handleSelectCitation}
            onSelectStarterPrompt={(prompt) => setComposerText(prompt)}
            onUploadFile={handleUploadFile}
            onOpenVaultDrawer={() => {
              setActiveCitation(null);
              setVaultDrawerOpen(true);
            }}
            onRetryLastUserMessage={(promptText) => void handleSend(promptText)}
          />

          <ChatComposer
            value={composerText}
            onChange={setComposerText}
            onSend={handleSend}
            onUploadFile={handleUploadFile}
            onToggleVaultDrawer={() => {
              setActiveCitation(null);
              setVaultDrawerOpen((prev) => !prev);
            }}
            isSending={isSending}
            isUploading={isUploading}
            completedDocsCount={completedCount}
            processingDocsCount={processingCount}
          />
        </main>

        {/* Contextual Source Citation Inspector Drawer */}
        <SourceInspectorDrawer
          selection={activeCitation}
          onSelectSourceIndex={(index, src) => {
            if (!activeCitation) return;
            setActiveCitation({
              ...activeCitation,
              citationIndex: index,
              source: src,
            });
          }}
          onClose={() => setActiveCitation(null)}
        />

        {/* Contextual Conversation Vault Drawer */}
        <VaultDrawer
          open={vaultDrawerOpen}
          onClose={() => setVaultDrawerOpen(false)}
          conversationTitle={currentConversation?.title}
          documents={documents}
          isLoading={isLoadingDocs}
          isPolling={isPolling}
          isUploading={isUploading}
          isRetrying={isRetrying}
          isDeleting={isDeletingDoc}
          onUploadFile={handleUploadFile}
          onRetryDocument={retryDocument}
          onDeleteDocument={deleteDocument}
        />
      </div>
    </div>
  );
}
