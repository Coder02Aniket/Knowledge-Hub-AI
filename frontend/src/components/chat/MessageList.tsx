import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  FileSearch,
  Database,
  Scale,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { ActiveCitationSelection, DocumentView, MessageView, SourceView } from '../../types/api';
import { MessageBubble } from './MessageBubble';
import { DropzoneUploader } from '../vault/DropzoneUploader';

interface MessageListProps {
  messages: MessageView[];
  documents: DocumentView[];
  isLoadingHistory: boolean;
  isSending: boolean;
  isUploading: boolean;
  activeCitation: ActiveCitationSelection | null;
  onSelectCitation: (
    messageId: string,
    citationIndex: number,
    source: SourceView,
    allSources: SourceView[]
  ) => void;
  onSelectStarterPrompt: (prompt: string) => void;
  onUploadFile: (file: File) => Promise<void>;
  onOpenVaultDrawer: () => void;
  onRetryLastUserMessage: (promptText: string) => void;
}

const STARTER_PROMPTS = [
  {
    category: 'EXECUTIVE SYNTHESIS',
    title: 'Summarize key findings & methodology',
    prompt:
      'Summarize the core findings, methodology, and primary conclusions from the uploaded documents, citing specific sections.',
    icon: FileSearch,
  },
  {
    category: 'COMPARATIVE AUDIT',
    title: 'Identify risks, assumptions & edge cases',
    prompt:
      'Extract all technical constraints, risks, or open assumptions mentioned in the Vault documents and organize them in a Markdown table with citations.',
    icon: Scale,
  },
  {
    category: 'DATA EXTRACTION',
    title: 'Tabulate metrics & quantitative figures',
    prompt:
      'List every quantitative metric, benchmark, or threshold reported in the documents along with its exact page and chunk citation.',
    icon: Database,
  },
];

export function MessageList({
  messages,
  documents,
  isLoadingHistory,
  isSending,
  isUploading,
  activeCitation,
  onSelectCitation,
  onSelectStarterPrompt,
  onUploadFile,
  onOpenVaultDrawer,
  onRetryLastUserMessage,
}: MessageListProps) {
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isSending]);

  const completedDocs = documents.filter((d) => d.status === 'COMPLETED');
  const processingDocs = documents.filter(
    (d) => d.status === 'PENDING' || d.status === 'PROCESSING'
  );

  // Find the most recent user message so a failed assistant turn can re-run it
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'USER');

  if (isLoadingHistory) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 bg-archival-grid">
        <div className="mx-auto max-w-4xl space-y-6 animate-fade-slide-up">
          {/* Editorial Hero Header */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 sm:p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] px-3 py-1 font-mono-code text-[0.68rem] font-semibold text-[var(--accent-primary)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>GROUNDED RAG RESEARCH OBSERVATORY</span>
            </div>

            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              Curate your Document Vault. Interrogate with cited precision.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)] leading-relaxed">
              Upload research monographs, technical specifications, CSV datasets, or JSON schemas
              before or during your session. Every claim synthesized from your Vault is anchored to
              verifiable <code className="font-mono-code text-[var(--accent-primary)]">[1]</code>{' '}
              vector chunks.
            </p>

            {/* Asymmetric Bento Grid: Left = Upload-First Dropzone, Right = Grounding Status & QuickPrompts */}
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono-code text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Step 01 · Seed Session Vault
                  </span>
                  {documents.length > 0 && (
                    <button
                      type="button"
                      onClick={onOpenVaultDrawer}
                      className="font-mono-code text-[0.7rem] font-semibold text-[var(--accent-primary)] hover:underline"
                    >
                      View {documents.length} attached →
                    </button>
                  )}
                </div>

                <DropzoneUploader
                  onUploadFile={onUploadFile}
                  isUploading={isUploading}
                  compact
                  helperLabel="Upload-first workflow: creates conversation & indexes automatically"
                />

                {documents.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs">
                    {completedDocs.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent-grounded)]">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {completedDocs.length} document{completedDocs.length === 1 ? '' : 's'} indexed & ready for RAG
                      </span>
                    ) : null}
                    {processingDocs.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-mono-code text-[0.72rem] text-[var(--accent-primary)]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        {processingDocs.length} indexing in background...
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="lg:col-span-6 flex flex-col justify-between space-y-2.5">
                <span className="font-mono-code text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Step 02 · Launch Analytical Inquiry
                </span>
                {STARTER_PROMPTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => onSelectStarterPrompt(item.prompt)}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 text-left transition-all hover:border-[var(--accent-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <span className="block font-mono-code text-[0.62rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            {item.category}
                          </span>
                          <p className="mt-0.5 text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                            {item.title}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="messages-container" className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.messageId}
            message={msg}
            activeCitation={activeCitation}
            onSelectCitation={onSelectCitation}
            onRetryFailedPrompt={
              msg.failed && lastUserMessage
                ? () => onRetryLastUserMessage(lastUserMessage.content)
                : undefined
            }
          />
        ))}

        {isSending && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-3.5 animate-fade-slide-up"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3">
              <p className="font-mono-code text-xs font-semibold text-[var(--accent-primary)]">
                {completedDocs.length > 0
                  ? `Retrieving top-K chunks across ${completedDocs.length} Vault document${
                      completedDocs.length === 1 ? '' : 's'
                    } & synthesizing...`
                  : 'Synthesizing response with Gemini...'}
              </p>
            </div>
          </div>
        )}

        <div ref={bottomAnchorRef} />
      </div>
    </div>
  );
}
