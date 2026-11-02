import React from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  RotateCcw,
  Trash2,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import type { DocumentView } from '../../types/api';
import { documentsApi } from '../../api/documents';
import { formatBytes, formatRelativeTime, getExtension } from '../../utils/formatters';
import { DocumentStatusBadge } from './DocumentStatusBadge';

interface DocumentCardProps {
  document: DocumentView;
  onRetry: (documentId: string) => void;
  onDelete: (document: DocumentView) => void;
  showConversationLink?: boolean;
  isRetrying?: boolean;
}

export function DocumentCard({
  document,
  onRetry,
  onDelete,
  showConversationLink = false,
  isRetrying = false,
}: DocumentCardProps) {
  const ext = getExtension(document.fileName);
  const isBusy = document.status === 'PENDING' || document.status === 'PROCESSING';

  return (
    <article
      className="group relative flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 transition-all hover:border-[var(--border-strong)]"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div>
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-mono-code text-[0.7rem] font-bold text-[var(--accent-primary)]">
              {ext}
            </div>
            <div className="min-w-0">
              <h3
                className="truncate text-xs font-semibold text-[var(--text-primary)]"
                title={document.fileName}
              >
                {document.fileName}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono-code text-[0.68rem] text-[var(--text-muted)]">
                <span>{formatBytes(document.fileSize)}</span>
                <span aria-hidden="true">·</span>
                <span>{formatRelativeTime(document.createdAt)}</span>
              </div>
            </div>
          </div>

          <DocumentStatusBadge status={document.status} chunkCount={document.chunkCount} />
        </div>

        {document.status === 'FAILED' && document.processingError && (
          <div
            className="mt-2.5 flex items-start gap-2 rounded-lg border p-2 text-[0.72rem]"
            style={{
              backgroundColor: 'var(--status-danger-soft)',
              borderColor: 'var(--status-danger)',
              color: 'var(--status-danger)',
            }}
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="leading-snug">{document.processingError}</span>
          </div>
        )}

        {showConversationLink && document.conversationId && (
          <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)]">
            <Link
              to={`/c/${document.conversationId}`}
              className="inline-flex items-center gap-1.5 text-[0.72rem] font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors max-w-full"
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-[var(--accent-primary)]" aria-hidden="true" />
              <span className="truncate">
                {document.conversationTitle || 'Open attached conversation'}
              </span>
            </Link>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5">
        <div className="flex items-center gap-1.5">
          <a
            href={documentsApi.getDownloadUrl(document.documentId)}
            download={document.fileName}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-[0.7rem] font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] no-underline transition-colors"
            aria-label={`Download ${document.fileName}`}
          >
            <Download className="h-3 w-3" aria-hidden="true" />
            <span>Download</span>
          </a>

          {document.status === 'FAILED' && document.retryable && (
            <button
              type="button"
              onClick={() => onRetry(document.documentId)}
              disabled={isRetrying}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] px-2 py-1 text-[0.7rem] font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Retry</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(document)}
          disabled={isBusy}
          title={
            isBusy
              ? 'Cannot delete while document is processing'
              : `Delete ${document.fileName}`
          }
          aria-label={`Delete ${document.fileName}`}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.7rem] font-medium text-[var(--text-muted)] hover:bg-[var(--status-danger-soft)] hover:text-[var(--status-danger)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Remove</span>
        </button>
      </div>
    </article>
  );
}
