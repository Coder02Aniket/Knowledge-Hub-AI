import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import type { DocumentStatus } from '../../types/api';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  chunkCount?: number | null;
}

export function DocumentStatusBadge({ status, chunkCount }: DocumentStatusBadgeProps) {
  if (status === 'COMPLETED') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold font-mono-code tracking-wide"
        style={{
          backgroundColor: 'var(--accent-grounded-soft)',
          borderColor: 'var(--accent-grounded)',
          color: 'var(--accent-grounded)',
        }}
      >
        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>
          INDEXED{typeof chunkCount === 'number' && chunkCount > 0 ? ` · ${chunkCount} CHUNKS` : ''}
        </span>
      </span>
    );
  }

  if (status === 'PROCESSING' || status === 'PENDING') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold font-mono-code tracking-wide"
        style={{
          backgroundColor: 'var(--accent-primary-soft)',
          borderColor: 'var(--accent-primary)',
          color: 'var(--accent-primary)',
        }}
      >
        {status === 'PROCESSING' ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
        )}
        <span>{status === 'PROCESSING' ? 'EMBEDDING...' : 'QUEUED'}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold font-mono-code tracking-wide"
      style={{
        backgroundColor: 'var(--status-danger-soft)',
        borderColor: 'var(--status-danger)',
        color: 'var(--status-danger)',
      }}
    >
      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>FAILED</span>
    </span>
  );
}
