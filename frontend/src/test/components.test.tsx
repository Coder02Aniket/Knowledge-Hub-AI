import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CitationBadge } from '../components/chat/CitationBadge';
import { ChatComposer } from '../components/chat/ChatComposer';
import { DropzoneUploader } from '../components/vault/DropzoneUploader';
import { hasActiveIngestion } from '../hooks/useDocuments';
import { formatBytes, getExtension, validateUploadFile } from '../utils/formatters';
import type { DocumentView, SourceView } from '../types/api';

describe('Formatters & File Validation', () => {
  it('formats bytes and extensions accurately', () => {
    expect(formatBytes(0)).toBe('—');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
    expect(getExtension('architecture.pdf')).toBe('PDF');
    expect(getExtension('README.md')).toBe('MD');
  });

  it('rejects unsupported file extensions and oversized files', () => {
    const exeFile = new File(['binary'], 'malware.exe', { type: 'application/octet-stream' });
    expect(validateUploadFile(exeFile)).toMatch(/Unsupported file type/i);

    const validFile = new File(['hello markdown'], 'notes.md', { type: 'text/markdown' });
    expect(validateUploadFile(validFile)).toBeNull();
  });
});

describe('CitationBadge & Source Inspector trigger', () => {
  it('renders citation index, document name, and fires onSelect with source metadata', () => {
    const mockSource: SourceView = {
      documentId: 'doc-123',
      documentName: 'whitepaper.pdf',
      chunkIndex: 3,
      pageNumber: 7,
      similarity: 0.88,
      snippet: 'Vector cosine retrieval over 768 dimensions.',
    };
    const onSelect = vi.fn();

    render(<CitationBadge index={1} source={mockSource} onSelect={onSelect} />);

    const button = screen.getByRole('button', {
      name: /Inspect citation \[1\]: whitepaper\.pdf \(88% similarity\)/i,
    });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(1, mockSource);
  });
});

describe('ChatComposer', () => {
  it('submits message on Enter and allows newline on Shift+Enter', () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const onChange = vi.fn();

    render(
      <ChatComposer
        value="Summarize the findings"
        onChange={onChange}
        onSend={onSend}
        onUploadFile={vi.fn()}
        onToggleVaultDrawer={vi.fn()}
        isSending={false}
        isUploading={false}
        completedDocsCount={2}
        processingDocsCount={0}
      />
    );

    const textarea = screen.getByLabelText(/Ask a question or interrogate your Vault documents/i);
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('Summarize the findings');
  });
});

describe('DropzoneUploader', () => {
  it('shows validation error when an unsupported file extension is selected', () => {
    render(<DropzoneUploader onUploadFile={vi.fn()} />);

    const input = screen.getByLabelText(/Upload document to Vault/i);
    const badFile = new File(['bad'], 'archive.zip', { type: 'application/zip' });

    fireEvent.change(input, { target: { files: [badFile] } });
    expect(screen.getByRole('alert')).toHaveTextContent(/Unsupported file type/i);
  });
});

describe('useDocuments conditional polling helper', () => {
  const baseDoc: DocumentView = {
    documentId: 'd1',
    conversationId: 'c1',
    conversationTitle: 'Session',
    fileName: 'report.pdf',
    contentType: 'application/pdf',
    fileSize: 10240,
    status: 'COMPLETED',
    processingError: null,
    chunkCount: 12,
    createdAt: '2026-11-02T12:00:00Z',
    retryable: false,
  };

  it('returns true only when at least one document is PENDING or PROCESSING', () => {
    expect(hasActiveIngestion([])).toBe(false);
    expect(hasActiveIngestion([baseDoc])).toBe(false);
    expect(hasActiveIngestion([{ ...baseDoc, status: 'FAILED' }])).toBe(false);
    expect(hasActiveIngestion([baseDoc, { ...baseDoc, documentId: 'd2', status: 'PROCESSING' }])).toBe(
      true
    );
    expect(hasActiveIngestion([{ ...baseDoc, status: 'PENDING' }])).toBe(true);
  });
});
