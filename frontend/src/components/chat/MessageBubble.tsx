import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  User,
} from 'lucide-react';
import type { ActiveCitationSelection, MessageView, SourceView } from '../../types/api';
import {
  formatSimilarityPercent,
  formatSourceLocation,
  formatTimeOfDay,
} from '../../utils/formatters';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageBubbleProps {
  message: MessageView;
  activeCitation: ActiveCitationSelection | null;
  onSelectCitation: (
    messageId: string,
    citationIndex: number,
    source: SourceView,
    allSources: SourceView[]
  ) => void;
  onRetryFailedPrompt?: () => void;
}

export function MessageBubble({
  message,
  activeCitation,
  onSelectCitation,
  onRetryFailedPrompt,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'USER';
  const sources = message.sources ?? [];

  const activeIndexForThisMessage =
    activeCitation && activeCitation.messageId === message.messageId
      ? activeCitation.citationIndex
      : null;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content || '');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-slide-up">
        <div className="max-w-2xl rounded-2xl rounded-br-xs border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-xs">
          <div className="mb-1 flex items-center justify-end gap-2 font-mono-code text-[0.65rem] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-secondary)]">
              <User className="h-3 w-3 text-[var(--accent-primary)]" aria-hidden="true" />
              RESEARCHER
            </span>
            {message.sentAt && <span>{formatTimeOfDay(message.sentAt)}</span>}
          </div>
          <div className="whitespace-pre-wrap leading-relaxed break-words">{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <article
      className="flex items-start gap-3.5 animate-fade-slide-up"
      aria-label="Assistant response"
    >
      {/* Assistant Emblem */}
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]"
        aria-hidden="true"
      >
        <Sparkles className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs font-semibold text-[var(--text-primary)]">
              KnowledgeHub Synthesis
            </span>
            {sources.length > 0 ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono-code text-[0.64rem] font-semibold"
                style={{
                  backgroundColor: 'var(--accent-grounded-soft)',
                  borderColor: 'var(--accent-grounded)',
                  color: 'var(--accent-grounded)',
                }}
              >
                GROUNDED · {sources.length} {sources.length === 1 ? 'CITATION' : 'CITATIONS'}
              </span>
            ) : (
              !message.failed && (
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono-code text-[0.64rem] text-[var(--text-muted)]">
                  GENERAL KNOWLEDGE
                </span>
              )
            )}
            {message.sentAt && (
              <span className="font-mono-code text-[0.65rem] text-[var(--text-muted)]">
                {formatTimeOfDay(message.sentAt)}
              </span>
            )}
          </div>

          {!message.failed && message.content && (
            <button
              type="button"
              onClick={handleCopyMessage}
              aria-label="Copy response"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono-code text-[0.68rem] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
            >
              {copied ? (
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
          )}
        </div>

        {/* Message Body or Error State */}
        {message.failed ? (
          <div
            role="alert"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4"
            style={{
              backgroundColor: 'var(--status-danger-soft)',
              borderColor: 'var(--status-danger)',
              color: 'var(--status-danger)',
            }}
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold">Synthesis Interrupted</p>
                <p className="mt-0.5 opacity-90">
                  {message.failureReason ||
                    'The AI provider could not complete the request. Please try again.'}
                </p>
              </div>
            </div>

            {onRetryFailedPrompt && (
              <button
                type="button"
                onClick={onRetryFailedPrompt}
                className="inline-flex shrink-0 items-center gap-1.5 self-start sm:self-center rounded-lg border border-current px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Retry Turn</span>
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 sm:p-5 shadow-xs">
            <MarkdownRenderer
              content={message.content}
              sources={sources}
              activeCitationIndex={activeIndexForThisMessage}
              onSelectCitation={(index, matchedSource) => {
                const target = matchedSource ?? sources[index - 1] ?? sources[0];
                if (target) {
                  onSelectCitation(message.messageId, index, target, sources);
                }
              }}
            />

            {/* Footnote Source Cards Strip */}
            {sources.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-[var(--border-subtle)]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono-code text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    <BookOpen className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden="true" />
                    Retrieved Vault Citations — Click to inspect verbatim chunk
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sources.map((src, idx) => {
                    const num = idx + 1;
                    const isSelected = activeIndexForThisMessage === num;
                    const pct = formatSimilarityPercent(src.similarity);
                    return (
                      <button
                        key={`${src.documentId}-${src.chunkIndex}-${num}`}
                        type="button"
                        onClick={() => onSelectCitation(message.messageId, num, src, sources)}
                        className={`group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]'
                        }`}
                      >
                        <span className="rounded bg-[var(--accent-primary)] px-1.5 py-0.5 font-mono-code text-[0.68rem] font-bold text-[var(--text-on-accent)]">
                          [{num}]
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[11rem] truncate text-xs font-semibold text-[var(--text-primary)]">
                            {src.documentName}
                          </p>
                          <p className="font-mono-code text-[0.64rem] text-[var(--text-muted)]">
                            {formatSourceLocation(src.pageNumber, src.chunkIndex)} ·{' '}
                            <span className="text-[var(--accent-grounded)] font-semibold">
                              {pct}%
                            </span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
