import React, { useId, useRef, useState } from 'react';
import { UploadCloud, FileText, AlertTriangle, Loader2, X } from 'lucide-react';
import { ALLOWED_EXTENSIONS, formatBytes, getExtension, validateUploadFile } from '../../utils/formatters';

interface DropzoneUploaderProps {
  onUploadFile: (file: File) => Promise<void>;
  isUploading?: boolean;
  compact?: boolean;
  helperLabel?: string;
}

export function DropzoneUploader({
  onUploadFile,
  isUploading = false,
  compact = false,
  helperLabel,
}: DropzoneUploaderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCandidateFile = (file: File | undefined | null) => {
    if (!file) return;
    setValidationError(null);
    const error = validateUploadFile(file);
    if (error) {
      setSelectedFile(null);
      setValidationError(error);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;
    const droppedFile = e.dataTransfer.files?.[0];
    handleCandidateFile(droppedFile);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || isUploading) return;
    setValidationError(null);
    try {
      await onUploadFile(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isUploading) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed transition-all ${
          compact ? 'p-4' : 'p-5'
        } ${
          isDragging
            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]'
            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 hover:border-[var(--border-strong)]'
        }`}
      >
        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.csv,.json"
          onChange={(e) => handleCandidateFile(e.target.files?.[0])}
          disabled={isUploading}
          className="sr-only"
          aria-label="Upload document to Vault"
        />

        {!selectedFile ? (
          <label
            htmlFor={inputId}
            className="flex cursor-pointer flex-col items-center justify-center text-center"
          >
            <div
              className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent-primary)]"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <UploadCloud className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              Drop a document here or <span className="underline text-[var(--accent-primary)]">browse files</span>
            </p>
            <p className="mt-1 text-[0.72rem] text-[var(--text-secondary)]">
              {helperLabel || 'Ingests, chunks, and embeds into pgvector for grounded citations'}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
              {ALLOWED_EXTENSIONS.map((ext) => (
                <span
                  key={ext}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono-code text-[0.65rem] font-semibold uppercase text-[var(--text-secondary)]"
                >
                  .{ext}
                </span>
              ))}
              <span className="font-mono-code text-[0.65rem] text-[var(--text-muted)]">
                MAX 20 MB
              </span>
            </div>
          </label>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary-soft)] font-mono-code text-[0.7rem] font-bold text-[var(--accent-primary)]">
                  {getExtension(selectedFile.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                    {selectedFile.name}
                  </p>
                  <p className="font-mono-code text-[0.7rem] text-[var(--text-secondary)]">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                disabled={isUploading}
                aria-label="Remove selected file"
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={clearSelection}
                disabled={isUploading}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Ingesting...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Index into Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {validationError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border p-2.5 text-xs"
          style={{
            backgroundColor: 'var(--status-danger-soft)',
            borderColor: 'var(--status-danger)',
            color: 'var(--status-danger)',
          }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
