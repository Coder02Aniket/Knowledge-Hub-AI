import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  X,
  FileText,
  Sparkles,
  Copy,
  Check,
  Layers,
} from 'lucide-react';
import type { ActiveCitationSelection, SourceView } from '../../types/api';
import { documentsApi } from '../../api/documents';
import {
  formatSimilarityPercent,
  formatSourceLocation,
  getExtension,
} from '../../utils/formatters';

interface SourceInspectorDrawerProps {
  selection: ActiveCitationSelection | null;
  onSelectSourceIndex: (index: number, source: SourceView) => void;
  onClose: () => void;
}

export function SourceInspectorDrawer({
  selection,
  onSelectSourceIndex,
  onClose,
}: SourceInspectorDrawerProps) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!selection) return null;

  const { citationIndex, source, allSources } = selection;
  const similarityPct = formatSimilarityPercent(source.similarity);
  const locationLabel = formatSourceLocation(source.pageNumber, source.chunkIndex);
  const ext = getExtension(source.documentName);

  const handleCopyExcerpt = async () => {
    try {
      await navigator.clipboard.writeText(source.snippet || '');
      setCopiedSnippet(true);
      window.setTimeout(() => setCopiedSnippet(false), 1800);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <aside
      aria-label="Citation Source Inspector"
      className="fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] xl:static xl:w-96 xl:shrink-0 animate-fade-slide-up"
      style={{ boxShadow: 'var(--shadow-drawer)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Source Citation Inspector
            </h2>
            <p className="font-mono-code text-[0.68rem] text-[var(--text-secondary)]">
              CITATION [{citationIndex}] OF {allSources.length}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Source Inspector"
          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Citation Selector Strip when message has multiple sources */}
      {allSources.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/50 px-4 py-2.5">
          {allSources.map((s, idx) => {
            const num = idx + 1;
            const active = num === citationIndex;
            return (
              <button
                key={`${s.documentId}-${s.chunkIndex}-${num}`}
                type="button"
                onClick={() => onSelectSourceIndex(num, s)}
                className={`shrink-0 rounded-lg border px-2.5 py-1 font-mono-code text-xs font-semibold transition-all ${
                  active
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                [{num}] {formatSimilarityPercent(s.similarity)}%
              </button>
            );
          })}
        </div>
      )}

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Source Document Card */}
        <div
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-mono-code text-xs font-bold text-[var(--accent-primary)]">
                {ext}
              </div>
              <div className="min-w-0">
                <span className="font-mono-code text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Source Document
                </span>
                <h3
                  className="truncate text-sm font-semibold text-[var(--text-primary)]"
                  title={source.documentName}
                >
                  {source.documentName}
                </h3>
              </div>
            </div>

            {source.documentId && (
              <a
                href={documentsApi.getDownloadUrl(source.documentId)}
                download={source.documentName}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] no-underline transition-colors"
                aria-label={`Download ${source.documentName}`}
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download</span>
              </a>
            )}
          </div>

          {/* Location & Cosine Similarity Meter */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
            <div className="rounded-lg bg-[var(--bg-surface)] p-2.5">
              <div className="flex items-center gap-1.5 font-mono-code text-[0.65rem] uppercase text-[var(--text-muted)]">
                <Layers className="h-3 w-3 text-[var(--accent-primary)]" aria-hidden="true" />
                <span>Vector Location</span>
              </div>
              <p className="mt-1 font-mono-code text-xs font-bold text-[var(--text-primary)]">
                {locationLabel}
              </p>
            </div>

            <div className="rounded-lg bg-[var(--bg-surface)] p-2.5">
              <div className="flex items-center justify-between font-mono-code text-[0.65rem] uppercase text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[var(--accent-grounded)]" aria-hidden="true" />
                  Similarity
                </span>
                <span className="font-bold text-[var(--accent-grounded)]">{similarityPct}%</span>
              </div>
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]"
                role="progressbar"
                aria-valuenow={similarityPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Cosine similarity score"
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${similarityPct}%`,
                    backgroundColor:
                      similarityPct >= 65
                        ? 'var(--accent-grounded)'
                        : 'var(--accent-primary)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Retrieved Verbatim Excerpt */}
        <div
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden="true" />
              <span className="font-mono-code text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Retrieved Verbatim Excerpt
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyExcerpt}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono-code text-[0.68rem] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
            >
              {copiedSnippet ? (
                <>
                  <Check className="h-3 w-3 text-[var(--accent-grounded)]" aria-hidden="true" />
                  <span className="text-[var(--accent-grounded)]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <blockquote className="mt-3 border-l-3 border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]/50 pl-3.5 py-2.5 pr-3 rounded-r-lg font-mono-code text-xs leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words">
            {source.snippet || 'No excerpt text stored for this chunk.'}
          </blockquote>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5 font-mono-code text-[0.68rem] text-[var(--text-muted)]">
        pgvector Cosine Similarity · Top-K Grounded Retrieval
      </div>
    </aside>
  );
}
