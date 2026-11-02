import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  X,
  FolderArchive,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import type { DocumentView } from '../../types/api';
import { DropzoneUploader } from './DropzoneUploader';
import { DocumentCard } from './DocumentCard';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface VaultDrawerProps {
  open: boolean;
  onClose: () => void;
  conversationTitle?: string;
  documents: DocumentView[];
  isLoading: boolean;
  isPolling: boolean;
  isUploading: boolean;
  isRetrying: boolean;
  isDeleting: boolean;
  onUploadFile: (file: File) => Promise<void>;
  onRetryDocument: (documentId: string) => Promise<unknown>;
  onDeleteDocument: (documentId: string) => Promise<unknown>;
}

export function VaultDrawer({
  open,
  onClose,
  conversationTitle,
  documents,
  isLoading,
  isPolling,
  isUploading,
  isRetrying,
  isDeleting,
  onUploadFile,
  onRetryDocument,
  onDeleteDocument,
}: VaultDrawerProps) {
  const [docPendingDelete, setDocPendingDelete] = useState<DocumentView | null>(null);

  if (!open) return null;

  const completedDocs = documents.filter((d) => d.status === 'COMPLETED');
  const totalChunks = completedDocs.reduce((acc, d) => acc + (d.chunkCount ?? 0), 0);

  const handleConfirmDelete = async () => {
    if (!docPendingDelete) return;
    await onDeleteDocument(docPendingDelete.documentId);
    setDocPendingDelete(null);
  };

  return (
    <>
      <aside
        aria-label="Conversation Document Vault"
        className="fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] xl:static xl:w-96 xl:shrink-0 animate-fade-slide-up"
        style={{ boxShadow: 'var(--shadow-drawer)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]">
              <Database className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                  Conversation Vault
                </h2>
                {isPolling && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-primary-soft)] px-2 py-0.5 font-mono-code text-[0.62rem] font-semibold text-[var(--accent-primary)]">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin" aria-hidden="true" />
                    SYNCING
                  </span>
                )}
              </div>
              <p className="truncate text-[0.7rem] text-[var(--text-secondary)]">
                {conversationTitle || 'New conversation — upload before or during chat'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Vault panel"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Telemetry Ribbon */}
        <div className="grid grid-cols-2 gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/50 px-4 py-2.5">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5">
            <span className="block font-mono-code text-[0.64rem] uppercase tracking-wider text-[var(--text-muted)]">
              Grounded Sources
            </span>
            <span className="font-mono-code text-sm font-bold text-[var(--text-primary)]">
              {completedDocs.length}{' '}
              <span className="text-xs font-normal text-[var(--text-secondary)]">
                / {documents.length}
              </span>
            </span>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5">
            <span className="block font-mono-code text-[0.64rem] uppercase tracking-wider text-[var(--text-muted)]">
              Vector Chunks
            </span>
            <span className="font-mono-code text-sm font-bold text-[var(--accent-grounded)]">
              {totalChunks}
            </span>
          </div>
        </div>

        {/* Uploader + Document List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <DropzoneUploader
            onUploadFile={onUploadFile}
            isUploading={isUploading}
            compact
            helperLabel="PDF, MD, TXT, CSV, JSON up to 20 MB"
          />

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-mono-code text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Attached Documents ({documents.length})
              </h3>
              <Link
                to="/vault"
                className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-[var(--accent-primary)] hover:underline"
              >
                <span>Global Library</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2.5 py-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-24 animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
                  />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 p-6 text-center">
                <FolderArchive
                  className="mx-auto h-7 w-7 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <p className="mt-2 text-xs font-semibold text-[var(--text-primary)]">
                  Vault is empty for this session
                </p>
                <p className="mt-1 text-[0.72rem] leading-relaxed text-[var(--text-secondary)]">
                  Upload research papers, technical specs, CSV datasets, or JSON payloads above.
                  Once indexed, responses cite exact chunks with{' '}
                  <code className="font-mono-code text-[var(--accent-primary)]">[1]</code> badges.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.documentId}
                    document={doc}
                    onRetry={(id) => onRetryDocument(id)}
                    onDelete={(d) => setDocPendingDelete(d)}
                    isRetrying={isRetrying}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5">
          <div className="flex items-center gap-2 text-[0.7rem] text-[var(--text-secondary)]">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--accent-primary)]" aria-hidden="true" />
            <span>
              {completedDocs.length > 0
                ? 'Strict RAG grounding active: answers cite your Vault chunks.'
                : 'General mode active until at least 1 document finishes indexing.'}
            </span>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={Boolean(docPendingDelete)}
        title="Remove Document from Vault?"
        description={
          docPendingDelete
            ? `"${docPendingDelete.fileName}" and its ${
                docPendingDelete.chunkCount ?? 0
              } embedded vector chunks will be permanently deleted from PostgreSQL pgvector and MinIO storage.`
            : ''
        }
        confirmLabel="Delete Document"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDocPendingDelete(null)}
      />
    </>
  );
}
