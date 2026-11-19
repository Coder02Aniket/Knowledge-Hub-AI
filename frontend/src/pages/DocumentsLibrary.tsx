import { useEffect, useState, useCallback } from 'react';
import { useDocumentStore } from '../store/documentStore';
import { useConversationStore } from '../store/conversationStore';
import { useDropzone } from 'react-dropzone';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  RefreshCw, 
  Download, 
  FileIcon, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { documentApi } from '../api/documents';
import { Link } from 'react-router-dom';

export function DocumentsLibrary() {
  const { 
    documents, 
    fetchDocuments, 
    uploadDocument, 
    deleteDocument, 
    retryDocument, 
    isLoading,
    isUploading,
    uploadError,
    clearError
  } = useDocumentStore();

  const { 
    conversations, 
    fetchConversations, 
    createConversation, 
    renameConversation 
  } = useConversationStore();

  const [selectedConvId, setSelectedConvId] = useState<string>('new');
  const [filterConvId, setFilterConvId] = useState<string>('all');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
    fetchConversations();
    
    // Poll for processing documents
    const interval = setInterval(() => {
      const hasProcessing = useDocumentStore.getState().documents.some(
        d => d.status === 'PENDING' || d.status === 'PROCESSING'
      );
      if (hasProcessing) {
        fetchDocuments();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [fetchDocuments, fetchConversations]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    clearError();
    setUploadSuccess(null);

    for (const file of acceptedFiles) {
      try {
        let convId = selectedConvId;
        if (convId === 'new') {
          const newConv = await createConversation();
          convId = newConv.conversationId;
          const cleanName = file.name.replace(/\.[^/.]+$/, "");
          await renameConversation(convId, `Vault: ${cleanName}`);
        }
        await uploadDocument(file, convId);
        setUploadSuccess(`"${file.name}" uploaded successfully and queued for indexing.`);
        setTimeout(() => setUploadSuccess(null), 6000);
      } catch (err: any) {
        // Handled in store
      }
    }
  }, [selectedConvId, createConversation, renameConversation, uploadDocument, clearError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md'],
    }
  });

  const displayedDocs = filterConvId === 'all' 
    ? documents 
    : documents.filter(d => d.conversationId === filterConvId);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Knowledge Library</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Documents stored in your personal vault and indexed for conversation retrieval.
          </p>
        </div>

        {/* Conversation Destination Selector */}
        <div className="flex items-center gap-2 bg-secondary/40 p-2 rounded-xl border border-border">
          <span className="text-xs font-medium text-muted-foreground pl-1">Attach uploads to:</span>
          <select
            value={selectedConvId}
            onChange={(e) => setSelectedConvId(e.target.value)}
            className="text-xs bg-background text-foreground border border-input rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            <option value="new">+ Create New Chat for Document</option>
            {conversations.map(c => (
              <option key={c.conversationId} value={c.conversationId}>
                Chat: {c.title || 'Untitled Chat'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Feedback */}
      {uploadSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle size={16} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-8 relative overflow-hidden",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/20",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
          {isUploading ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
        </div>
        <p className="text-sm font-medium text-foreground">
          {isUploading ? "Uploading and indexing document..." : "Click to upload or drag & drop files here"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supported formats: PDF, TXT, DOCX, MD (up to 50MB)
        </p>
      </div>

      {/* Documents Table View */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-border bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Vault Documents ({displayedDocs.length})
          </h2>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filter:</span>
            <select
              value={filterConvId}
              onChange={(e) => setFilterConvId(e.target.value)}
              className="text-xs bg-background text-foreground border border-input rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Conversations</option>
              {conversations.map(c => (
                <option key={c.conversationId} value={c.conversationId}>
                  {c.title || 'Untitled'}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {isLoading && documents.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Loading documents...
          </div>
        ) : displayedDocs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <FileIcon size={24} className="opacity-50" />
            </div>
            <p className="font-medium text-foreground">No documents found</p>
            <p className="text-xs mt-1">Drop a file above to add documents to your knowledge base.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/10 border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Document Name</th>
                  <th className="px-6 py-3 font-medium">Indexing Status</th>
                  <th className="px-6 py-3 font-medium">Associated Chat</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium">Uploaded</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedDocs.map((doc) => (
                  <tr key={doc.documentId} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground truncate max-w-[200px] md:max-w-xs" title={doc.fileName}>
                          {doc.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {doc.status === 'COMPLETED' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                        {doc.status === 'FAILED' && (
                          <span className="w-2 h-2 rounded-full bg-destructive" />
                        )}
                        {(doc.status === 'PENDING' || doc.status === 'PROCESSING') && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {doc.status.toLowerCase()}
                          {doc.chunkCount ? ` (${doc.chunkCount} chunks)` : ''}
                        </span>
                      </div>
                      {doc.status === 'FAILED' && doc.processingError && (
                        <p className="text-[11px] text-destructive mt-0.5 max-w-[180px] truncate" title={doc.processingError}>
                          {doc.processingError}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {doc.conversationId ? (
                        <Link 
                          to={`/chat/${doc.conversationId}`}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                        >
                          <MessageSquare size={13} />
                          <span className="truncate max-w-[150px]">{doc.conversationTitle || 'Chat'}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {doc.sizeLabel || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.status === 'FAILED' && doc.retryable && (
                          <button 
                            onClick={() => retryDocument(doc.documentId)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                            title="Retry Processing"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => documentApi.download(doc.documentId)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          onClick={() => deleteDocument(doc.documentId)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
