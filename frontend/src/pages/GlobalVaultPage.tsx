import React, { useMemo, useState } from 'react';
import {
  Search,
  FolderArchive,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { DocumentCard } from '../components/vault/DocumentCard';
import { DropzoneUploader } from '../components/vault/DropzoneUploader';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useDocuments } from '../hooks/useDocuments';
import { useConversations } from '../hooks/useConversations';
import { useToast } from '../components/ui/ToastProvider';
import { ALLOWED_EXTENSIONS, formatBytes, getExtension } from '../utils/formatters';
import type { DocumentStatus, DocumentView } from '../types/api';

interface GlobalVaultPageProps {
  onOpenMobileSidebar: () => void;
}

export function GlobalVaultPage({ onOpenMobileSidebar }: GlobalVaultPageProps) {
  const { pushToast } = useToast();
  const {
    documents,
    completedCount,
    isPolling,
    isLoading,
    uploadDocument,
    isUploading,
    retryDocument,
    isRetrying,
    deleteDocument,
    isDeleting,
  } = useDocuments(null, true);

  const { conversations, createConversation } = useConversations(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DocumentStatus>('ALL');
  const [extFilter, setExtFilter] = useState<string>('ALL');
  const [targetConvIdForUpload, setTargetConvIdForUpload] = useState<string>('NEW');
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [docPendingDelete, setDocPendingDelete] = useState<DocumentView | null>(null);

  const totalBytes = useMemo(
    () => documents.reduce((acc, d) => acc + (d.fileSize || 0), 0),
    [documents]
  );
  const totalChunks = useMemo(
    () => documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0),
    [documents]
  );

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (statusFilter !== 'ALL') {
        if (
          statusFilter === 'PROCESSING' &&
          doc.status !== 'PROCESSING' &&
          doc.status !== 'PENDING'
        ) {
          return false;
        } else if (statusFilter !== 'PROCESSING' && doc.status !== statusFilter) {
          return false;
        }
      }
      if (extFilter !== 'ALL' && getExtension(doc.fileName) !== extFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchFile = doc.fileName.toLowerCase().includes(q);
        const matchConv = (doc.conversationTitle || '').toLowerCase().includes(q);
        return matchFile || matchConv;
      }
      return true;
    });
  }, [documents, statusFilter, extFilter, searchQuery]);

  const handleGlobalUpload = async (file: File) => {
    let convId = targetConvIdForUpload;
    if (!convId || convId === 'NEW') {
      const created = await createConversation();
      convId = created.id;
    }
    const uploaded = await uploadDocument({
      file,
      targetConversationId: convId,
    });
    pushToast({
      variant: 'info',
      title: `Uploaded ${uploaded.fileName}`,
      description: 'Processing and indexing vector chunks in the background.',
    });
    setShowUploadPanel(false);
  };

  const handleConfirmDelete = async () => {
    if (!docPendingDelete) return;
    await deleteDocument(docPendingDelete.documentId);
    setDocPendingDelete(null);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <TopBar
        title="Global Document Vault"
        canRename={false}
        completedDocsCount={completedCount}
        totalDocsCount={documents.length}
        onOpenMobileSidebar={onOpenMobileSidebar}
      />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 bg-archival-grid">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Summary Telemetry Bento */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <span className="font-mono-code text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                Total Documents
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">
                {documents.length}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <span className="font-mono-code text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                Indexed & Grounded
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--accent-grounded)]">
                {completedCount}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <span className="font-mono-code text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                pgvector Chunks
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--accent-primary)]">
                {totalChunks}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <span className="font-mono-code text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                MinIO Vault Footprint
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">
                {formatBytes(totalBytes)}
              </p>
            </div>
          </div>

          {/* Filter & Upload Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[14rem]">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <label htmlFor="global-vault-search" className="sr-only">
                  Search documents by filename or conversation title
                </label>
                <input
                  id="global-vault-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by filename or session title..."
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isPolling && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary-soft)] px-3 py-1 font-mono-code text-[0.68rem] font-semibold text-[var(--accent-primary)]">
                    <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
                    AUTO-POLLING INGESTION
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setShowUploadPanel((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-3.5 py-2 text-xs font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-primary-hover)] transition-colors cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" aria-hidden="true" />
                  <span>{showUploadPanel ? 'Close Uploader' : 'Upload Document'}</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono-code text-[0.65rem] uppercase text-[var(--text-muted)] mr-1">
                  Status:
                </span>
                {(['ALL', 'COMPLETED', 'PROCESSING', 'FAILED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-2.5 py-1 font-mono-code text-[0.68rem] font-semibold transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono-code text-[0.65rem] uppercase text-[var(--text-muted)] mr-1">
                  Format:
                </span>
                <button
                  type="button"
                  onClick={() => setExtFilter('ALL')}
                  className={`rounded-lg px-2 py-1 font-mono-code text-[0.68rem] font-semibold transition-colors cursor-pointer ${
                    extFilter === 'ALL'
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  ALL
                </button>
                {ALLOWED_EXTENSIONS.map((ext) => {
                  const upper = ext.toUpperCase();
                  return (
                    <button
                      key={upper}
                      type="button"
                      onClick={() => setExtFilter(upper)}
                      className={`rounded-lg px-2 py-1 font-mono-code text-[0.68rem] font-semibold transition-colors cursor-pointer ${
                        extFilter === upper
                          ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {upper}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expandable Upload Panel */}
            {showUploadPanel && (
              <div className="mt-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3 animate-fade-slide-up">
                <div>
                  <label
                    htmlFor="upload-target-conv"
                    className="block font-mono-code text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                  >
                    Attach Document to Session
                  </label>
                  <select
                    id="upload-target-conv"
                    value={targetConvIdForUpload}
                    onChange={(e) => setTargetConvIdForUpload(e.target.value)}
                    className="mt-1.5 w-full sm:w-80 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  >
                    <option value="NEW">+ Create a new research session</option>
                    {conversations.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || 'New conversation'}
                      </option>
                    ))}
                  </select>
                </div>

                <DropzoneUploader
                  onUploadFile={handleGlobalUpload}
                  isUploading={isUploading}
                />
              </div>
            )}
          </div>

          {/* Document Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-36 animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
                />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 p-12 text-center">
              <FolderArchive
                className="mx-auto h-10 w-10 text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <h2 className="mt-3 font-display text-lg font-semibold text-[var(--text-primary)]">
                No documents match the current view
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Upload a PDF, Markdown, TXT, CSV, or JSON document to begin vector indexing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocs.map((doc) => (
                <DocumentCard
                  key={doc.documentId}
                  document={doc}
                  onRetry={(id) => void retryDocument(id)}
                  onDelete={(d) => setDocPendingDelete(d)}
                  showConversationLink
                  isRetrying={isRetrying}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={Boolean(docPendingDelete)}
        title="Delete Document from Vault?"
        description={
          docPendingDelete
            ? `"${docPendingDelete.fileName}" and its ${
                docPendingDelete.chunkCount ?? 0
              } embedded chunks will be permanently removed.`
            : ''
        }
        confirmLabel="Delete Document"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDocPendingDelete(null)}
      />
    </div>
  );
}
