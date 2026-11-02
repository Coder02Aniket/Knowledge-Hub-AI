export interface AuthStatusResponse {
  authenticated: boolean;
  username?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ConversationView {
  id: string;
  title: string;
  updatedAt: string;
}

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface SourceView {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  pageNumber: number | null;
  similarity: number;
  snippet: string;
}

export interface MessageView {
  messageId: string;
  role: MessageRole;
  content: string;
  sentAt: string;
  failed: boolean;
  failureReason: string | null;
  sources: SourceView[];
}

export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface DocumentView {
  documentId: string;
  conversationId: string | null;
  conversationTitle: string | null;
  fileName: string;
  contentType: string | null;
  fileSize: number;
  status: DocumentStatus;
  processingError: string | null;
  chunkCount: number | null;
  createdAt: string;
  retryable: boolean;
}

export interface ActiveCitationSelection {
  messageId: string;
  citationIndex: number; // 1-based index matching [1], [2]
  source: SourceView;
  allSources: SourceView[];
}
