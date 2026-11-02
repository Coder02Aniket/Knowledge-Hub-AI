import React, { useEffect, useRef, useState } from 'react';
import {
  Send,
  Paperclip,
  Database,
  Loader2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { validateUploadFile } from '../../utils/formatters';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => Promise<void>;
  onUploadFile: (file: File) => Promise<void>;
  onToggleVaultDrawer: () => void;
  isSending: boolean;
  isUploading: boolean;
  completedDocsCount: number;
  processingDocsCount: number;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onUploadFile,
  onToggleVaultDrawer,
  isSending,
  isUploading,
  completedDocsCount,
  processingDocsCount,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isSending) return;
    await onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const processSelectedFile = async (file: File | null | undefined) => {
    if (!file) return;
    setFileError(null);
    const err = validateUploadFile(file);
    if (err) {
      setFileError(err);
      return;
    }
    try {
      await onUploadFile(file);
    } catch (uploadErr) {
      setFileError(
        uploadErr instanceof Error ? uploadErr.message : 'Failed to upload file.'
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    void processSelectedFile(file);
  };

  return (
    <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 px-4 py-3 sm:px-8 backdrop-blur-md">
      <div className="mx-auto max-w-3xl space-y-2">
        {fileError && (
          <div
            role="alert"
            className="flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs"
            style={{
              backgroundColor: 'var(--status-danger-soft)',
              borderColor: 'var(--status-danger)',
              color: 'var(--status-danger)',
            }}
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {fileError}
            </span>
            <button
              type="button"
              onClick={() => setFileError(null)}
              className="underline font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={`relative rounded-2xl border transition-all bg-[var(--bg-elevated)] p-2.5 ${
            isDraggingOver
              ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30'
              : 'border-[var(--border-subtle)] focus-within:border-[var(--accent-primary)]'
          }`}
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json"
            onChange={(e) => void processSelectedFile(e.target.files?.[0])}
            className="sr-only"
            aria-label="Attach document to conversation Vault"
          />

          <label htmlFor="chat-composer-input" className="sr-only">
            Ask a question or interrogate your Vault documents
          </label>
          <textarea
            id="chat-composer-input"
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            placeholder={
              completedDocsCount > 0
                ? `Interrogate ${completedDocsCount} indexed Vault document${
                    completedDocsCount === 1 ? '' : 's'
                  } (citations [1], [2] enabled)...`
                : 'Ask anything, or drop a PDF / MD / CSV / JSON file here to ground this chat...'
            }
            className="w-full resize-none border-0 bg-transparent px-2 py-1 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none disabled:opacity-60"
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)]/70 pt-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                aria-label="Attach file to Vault"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-primary)]" aria-hidden="true" />
                ) : (
                  <Paperclip className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden="true" />
                )}
                <span>{isUploading ? 'Uploading...' : 'Attach to Vault'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleVaultDrawer}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono-code text-[0.7rem] font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Database
                  className="h-3.5 w-3.5"
                  style={{
                    color:
                      completedDocsCount > 0
                        ? 'var(--accent-grounded)'
                        : 'var(--text-muted)',
                  }}
                  aria-hidden="true"
                />
                <span>
                  {completedDocsCount > 0
                    ? `${completedDocsCount} Grounded`
                    : '0 Grounded'}
                </span>
                {processingDocsCount > 0 && (
                  <span className="text-[var(--accent-primary)]">
                    (+{processingDocsCount} indexing)
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="hidden sm:inline font-mono-code text-[0.66rem] text-[var(--text-muted)]">
                Enter to send · Shift+Enter newline
              </span>

              <button
                type="submit"
                disabled={!value.trim() || isSending}
                aria-label="Send message"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-40 cursor-pointer"
              >
                {isSending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
