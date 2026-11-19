export type MessageRole = 'USER' | 'ASSISTANT';

export interface SourceView {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  pageNumber?: number;
  similarity: number;
  snippet: string;
  scoreLabel?: string;
  locationLabel?: string;
  /** Retriever(s) that produced this chunk, e.g. "VECTOR", "GREP" or "VECTOR+LEXICAL+GREP". */
  retrievalMethod?: string;
}

export interface MessageView {
  messageId: string;
  role: MessageRole;
  content: string;
  sentAt: string;
  failed: boolean;
  failureReason?: string;
  sources: SourceView[];
}

export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface DocumentView {
  documentId: string;
  conversationId: string;
  conversationTitle: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  status: DocumentStatus;
  processingError?: string;
  chunkCount?: number;
  createdAt: string;
  retryable: boolean;
  sizeLabel?: string;
  extension?: string;
  isReady?: boolean;
}

export interface Conversation {
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  userId: string;
  email: string;
  name: string;
  roles: string[];
}
