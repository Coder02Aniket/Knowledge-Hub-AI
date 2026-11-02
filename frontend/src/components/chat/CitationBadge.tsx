import React from 'react';
import type { SourceView } from '../../types/api';
import { formatSimilarityPercent } from '../../utils/formatters';

interface CitationBadgeProps {
  index: number; // 1-based citation number e.g. 1 for [1]
  source?: SourceView;
  isActive?: boolean;
  onSelect: (index: number, source?: SourceView) => void;
}

export function CitationBadge({
  index,
  source,
  isActive = false,
  onSelect,
}: CitationBadgeProps) {
  const similarityPct = source ? formatSimilarityPercent(source.similarity) : null;
  const label = source
    ? `Inspect citation [${index}]: ${source.documentName} (${similarityPct}% similarity)`
    : `Citation [${index}]`;

  return (
    <button
      type="button"
      onClick={() => onSelect(index, source)}
      aria-label={label}
      title={
        source
          ? `[${index}] ${source.documentName} · ${
              source.pageNumber ? `p. ${source.pageNumber} · ` : ''
            }chunk ${source.chunkIndex + 1} (${similarityPct}% match)`
          : `[${index}]`
      }
      className={`mx-0.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.2 font-mono-code text-[0.72rem] font-semibold align-baseline transition-all cursor-pointer ${
        isActive
          ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--accent-primary)]'
          : 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)]'
      }`}
    >
      <span>[{index}]</span>
      {source && (
        <span className="hidden sm:inline max-w-[9rem] truncate text-[0.66rem] opacity-90">
          {source.documentName}
        </span>
      )}
    </button>
  );
}
