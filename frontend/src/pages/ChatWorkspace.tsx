import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversationStore } from '../store/conversationStore';
import { useDocumentStore } from '../store/documentStore';
import { ChatComposer } from '../components/chat/ChatComposer';
import { MessageItem } from '../components/chat/MessageItem';
import { 
  Loader2, 
  MessageSquare, 
  Files, 
  FileText, 
  PanelRightClose, 
  UploadCloud, 
  Trash2, 
  RefreshCw, 
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { documentApi } from '../api/documents';
import { cn } from '../lib/utils';

export function ChatWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    conversations,
    activeConversationId, 
    setActiveConversation, 
    messages, 
    isLoadingMessages, 
    isSending, 
    sendMessage,
    deleteConversation,
    renameConversation
  } = useConversationStore();

  const { 
    documents, 
    fetchDocuments, 
    uploadDocument, 
    deleteDocument, 
    retryDocument, 
    isUploading 
  } = useDocumentStore();

  const [vaultOpen, setVaultOpen] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelFileInputRef = useRef<HTMLInputElement>(null);

  // Active conversation object
  const currentConversation = conversations.find(c => c.conversationId === activeConversationId);

  // Sync route parameter `id` into store ONLY when the route parameter changes
  useEffect(() => {
    setActiveConversation(id || null);
  }, [id, setActiveConversation]);

  // Fetch documents for the current conversation when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchDocuments(activeConversationId);
    }
  }, [activeConversationId, fetchDocuments]);

  // Poll for document processing if any document in the conversation is PENDING or PROCESSING
  useEffect(() => {
    if (!activeConversationId) return;
    const interval = setInterval(() => {
      const convDocs = useDocumentStore.getState().documents.filter(d => d.conversationId === activeConversationId);
      const hasProcessing = convDocs.some(d => d.status === 'PENDING' || d.status === 'PROCESSING');
      if (hasProcessing) {
        fetchDocuments(activeConversationId);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConversationId, fetchDocuments]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    const resultingConvId = await sendMessage(content);
    if (resultingConvId && resultingConvId !== id) {
      navigate(`/chat/${resultingConvId}`, { replace: true });
    }
  };

  const handleDeleteActiveChat = async () => {
    if (!activeConversationId) return;
    const title = currentConversation?.title || 'this conversation';
    if (window.confirm(`Delete "${title}"? All messages and vault documents will be permanently removed.`)) {
      await deleteConversation(activeConversationId);
      navigate('/chat');
    }
  };

  const handleSaveTitle = async () => {
    if (activeConversationId && newTitle.trim()) {
      await renameConversation(activeConversationId, newTitle.trim());
    }
    setIsRenaming(false);
  };

  const handlePanelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setPanelError(null);
      try {
        const doc = await uploadDocument(files[0], activeConversationId || undefined);
        if (doc.conversationId && doc.conversationId !== id) {
          navigate(`/chat/${doc.conversationId}`, { replace: true });
        }
      } catch (err: any) {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Upload failed.';
        setPanelError(msg);
      } finally {
        if (panelFileInputRef.current) panelFileInputRef.current.value = '';
      }
    }
  };

  // Documents attached to this conversation
  const convDocuments = activeConversationId 
    ? documents.filter(d => d.conversationId === activeConversationId) 
    : [];

  const completedCount = convDocuments.filter(d => d.status === 'COMPLETED').length;

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Chat Header Bar */}
        <div className="h-12 border-b border-border/80 px-4 flex items-center justify-between bg-card/40 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden flex-1 mr-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:inline">Conversation:</span>
            {isRenaming ? (
              <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsRenaming(false);
                  }}
                  className="bg-background text-xs px-2.5 py-1 rounded-md border border-primary focus:outline-none flex-1"
                  autoFocus
                />
                <button 
                  onClick={handleSaveTitle} 
                  className="p-1 hover:text-foreground text-muted-foreground rounded" 
                  title="Save title"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => setIsRenaming(false)} 
                  className="p-1 hover:text-foreground text-muted-foreground rounded" 
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-sm font-medium text-foreground truncate max-w-xs md:max-w-md">
                  {currentConversation?.title || (activeConversationId ? 'Chat' : 'New Knowledge Chat')}
                </span>
                {activeConversationId && (
                  <button 
                    onClick={() => {
                      setIsRenaming(true);
                      setNewTitle(currentConversation?.title || '');
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="Rename conversation"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeConversationId && (
              <button
                onClick={handleDeleteActiveChat}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Delete conversation"
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              onClick={() => setVaultOpen(!vaultOpen)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                vaultOpen 
                  ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                  : "bg-secondary/60 text-foreground hover:bg-secondary border-border"
              )}
              title="Toggle Document Vault"
            >
              <Files size={14} />
              <span>Vault ({convDocuments.length})</span>
              {completedCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title={`${completedCount} ready for retrieval`} />
              )}
            </button>
          </div>
        </div>

        {/* Message Area */}
        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={20} />
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 text-primary shadow-sm border border-primary/10">
              <MessageSquare size={32} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
              What would you like to understand today?
            </h2>
            <p className="text-muted-foreground max-w-md text-sm">
              Ask questions across your documents or attach a file using the paperclip to ground the AI with your data.
            </p>

            <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-md">
              <button 
                onClick={() => setVaultOpen(true)}
                className="px-3 py-1.5 rounded-md border border-border bg-secondary/50 hover:bg-secondary text-xs font-medium text-foreground transition-colors flex items-center gap-1.5"
              >
                <Files size={14} className="text-primary" />
                View conversation documents ({convDocuments.length})
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
            <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-32">
              {messages.map((msg, index) => (
                <MessageItem key={msg.messageId || index} message={msg} />
              ))}
              {isSending && (
                <div className="flex items-center gap-3 text-muted-foreground text-sm p-4 max-w-3xl mx-auto">
                  <Loader2 className="animate-spin" size={16} />
                  Synthesizing answer from knowledge base...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Composer Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-3xl mx-auto w-full">
            <ChatComposer onSend={handleSend} disabled={isSending} />
            <div className="text-center mt-2 text-[10px] text-muted-foreground uppercase tracking-widest">
              AI answers are grounded in your uploaded documents.
            </div>
          </div>
        </div>
      </div>

      {/* Side Context/Vault Panel */}
      {vaultOpen && (
        <div className="w-80 md:w-96 border-l border-border bg-card flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-200">
          <div className="h-12 border-b border-border px-4 flex items-center justify-between bg-secondary/20">
            <div className="flex items-center gap-2">
              <Files size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Document Vault</h3>
            </div>
            <button
              onClick={() => setVaultOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary"
            >
              <PanelRightClose size={16} />
            </button>
          </div>

          <div className="p-4 border-b border-border bg-secondary/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">Attach to this chat</span>
              {isUploading && (
                <span className="text-[11px] text-primary flex items-center gap-1 font-medium">
                  <Loader2 size={12} className="animate-spin" /> Uploading...
                </span>
              )}
            </div>
            <input
              type="file"
              ref={panelFileInputRef}
              onChange={handlePanelUpload}
              className="hidden"
              accept=".pdf,.txt,.docx,.md"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => panelFileInputRef.current?.click()}
              className="w-full py-3 px-4 border border-dashed border-border hover:border-primary/60 rounded-xl bg-background/50 hover:bg-secondary/40 text-center transition-colors flex flex-col items-center gap-1.5"
            >
              <UploadCloud size={20} className="text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Upload document</span>
              <span className="text-[10px] text-muted-foreground">PDF, TXT, DOCX</span>
            </button>

            {panelError && (
              <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-xs border border-destructive/20 flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span className="truncate">{panelError}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Attached Documents ({convDocuments.length})
            </div>

            {convDocuments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No documents attached</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">
                  Upload files to provide knowledge for this conversation.
                </p>
              </div>
            ) : (
              convDocuments.map((doc) => (
                <div
                  key={doc.documentId}
                  className="p-3 rounded-xl border border-border bg-background hover:bg-secondary/20 transition-colors space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate" title={doc.fileName}>
                        {doc.fileName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.status === 'FAILED' && doc.retryable && (
                        <button
                          onClick={() => retryDocument(doc.documentId)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded"
                          title="Retry processing"
                        >
                          <RefreshCw size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => documentApi.download(doc.documentId)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded"
                        title="Download file"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.documentId)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded"
                        title="Remove from vault"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{doc.sizeLabel || ''}</span>
                    <div className="flex items-center gap-1.5">
                      {doc.status === 'COMPLETED' && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 size={12} /> Ready ({doc.chunkCount || 0} chunks)
                        </span>
                      )}
                      {(doc.status === 'PENDING' || doc.status === 'PROCESSING') && (
                        <span className="text-blue-500 font-medium flex items-center gap-1 animate-pulse">
                          <Clock size={12} /> Indexing...
                        </span>
                      )}
                      {doc.status === 'FAILED' && (
                        <span className="text-destructive font-medium flex items-center gap-1" title={doc.processingError}>
                          <AlertTriangle size={12} /> Failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
