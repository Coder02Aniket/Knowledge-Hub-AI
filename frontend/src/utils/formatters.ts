import type { ConversationView } from '../types/api';

export const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'md', 'csv', 'json'] as const;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes <= 0) {
    return '—';
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function getExtension(fileName: string | null | undefined): string {
  if (!fileName) return 'DOC';
  const dot = fileName.lastIndexOf('.');
  if (dot < 0 || dot === fileName.length - 1) {
    return 'DOC';
  }
  return fileName.substring(dot + 1).toUpperCase();
}

export function validateUploadFile(file: File): string | null {
  if (!file.name || file.name.trim().length === 0) {
    return 'A file name is required.';
  }
  if (file.name.length > 255) {
    return 'The file name is too long (maximum 255 characters).';
  }
  if (file.size <= 0) {
    return 'The uploaded file is empty.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'The file is too large. Maximum allowed size is 20 MB.';
  }
  const ext = getExtension(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return `Unsupported file type (.${ext}). Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}.`;
  }
  return null;
}

export function formatSimilarityPercent(similarity: number): number {
  if (Number.isNaN(similarity)) return 0;
  return Math.max(0, Math.min(100, Math.round(similarity * 100)));
}

export function formatSourceLocation(pageNumber: number | null, chunkIndex: number): string {
  if (pageNumber !== null && pageNumber !== undefined && pageNumber > 0) {
    return `p. ${pageNumber} · chunk ${chunkIndex + 1}`;
  }
  return `chunk ${chunkIndex + 1}`;
}

export function formatRelativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 45) return 'Just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 172800) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimeOfDay(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export type ConversationGroupKey = 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older';

export interface GroupedConversations {
  label: ConversationGroupKey;
  items: ConversationView[];
}

export function groupConversationsByDate(conversations: ConversationView[]): GroupedConversations[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400 * 1000;
  const startOfSevenDaysAgo = startOfToday - 7 * 86400 * 1000;

  const buckets: Record<ConversationGroupKey, ConversationView[]> = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  for (const conv of conversations) {
    const t = new Date(conv.updatedAt).getTime();
    if (Number.isNaN(t) || t >= startOfToday) {
      buckets.Today.push(conv);
    } else if (t >= startOfYesterday) {
      buckets.Yesterday.push(conv);
    } else if (t >= startOfSevenDaysAgo) {
      buckets['Previous 7 Days'].push(conv);
    } else {
      buckets.Older.push(conv);
    }
  }

  const order: ConversationGroupKey[] = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];
  return order
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ label: key, items: buckets[key] }));
}

export function deriveTitleFromPrompt(prompt: string): string {
  const clean = prompt.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (!clean) return 'New conversation';
  return clean.length > 60 ? `${clean.substring(0, 57)}...` : clean;
}
