import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MessageSquare,
  FolderArchive,
  Pencil,
  Trash2,
  Check,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import type { ConversationView } from '../../types/api';
import { formatRelativeTime, groupConversationsByDate } from '../../utils/formatters';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface SidebarProps {
  conversations: ConversationView[];
  activeConversationId: string | null;
  username: string | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onCreateNewChat: () => Promise<void>;
  onRenameConversation: (id: string, title: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  onLogout: () => Promise<void>;
  isDeleting?: boolean;
}

export function Sidebar({
  conversations,
  activeConversationId,
  username,
  isOpenMobile,
  onCloseMobile,
  onCreateNewChat,
  onRenameConversation,
  onDeleteConversation,
  onLogout,
  isDeleting = false,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [convPendingDelete, setConvPendingDelete] = useState<ConversationView | null>(null);

  const filtered = conversations.filter((c) =>
    (c.title || 'New conversation').toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const grouped = groupConversationsByDate(filtered);

  const startEditing = (conv: ConversationView, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title || 'New conversation');
  };

  const commitRename = async (id: string) => {
    const trimmed = editingTitle.trim();
    setEditingId(null);
    if (!trimmed) return;
    await onRenameConversation(id, trimmed);
  };

  const handleConfirmDelete = async () => {
    if (!convPendingDelete) return;
    const targetId = convPendingDelete.id;
    await onDeleteConversation(targetId);
    setConvPendingDelete(null);
    if (activeConversationId === targetId) {
      navigate('/');
    }
  };

  const isGlobalVaultActive = location.pathname === '/vault';

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Workspace navigation and conversation index"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-transform md:static md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3.5">
          <Link
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 no-underline group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <span className="block font-display text-sm font-bold tracking-tight text-[var(--text-primary)]">
                KnowledgeHub AI
              </span>
              <span className="block font-mono-code text-[0.62rem] uppercase tracking-widest text-[var(--text-muted)]">
                RAG Observatory
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] md:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Primary Actions */}
        <div className="p-3 space-y-2 border-b border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={async () => {
              await onCreateNewChat();
              onCloseMobile();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-3.5 py-2.5 text-xs font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-primary-hover)] transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New Research Session</span>
          </button>

          <Link
            to="/vault"
            onClick={onCloseMobile}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold no-underline transition-all ${
              isGlobalVaultActive
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderArchive className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
              <span>Global Document Vault</span>
            </span>
            <span className="font-mono-code text-[0.65rem] uppercase text-[var(--text-muted)]">
              INDEX
            </span>
          </Link>

          {/* Instant Filter */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <label htmlFor="sidebar-conv-filter" className="sr-only">
              Filter conversations
            </label>
            <input
              id="sidebar-conv-filter"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter sessions..."
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Chronological Conversation List */}
        <nav
          aria-label="Conversation history"
          className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4"
        >
          {grouped.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                {searchQuery ? 'No matching sessions found.' : 'No research sessions yet.'}
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="space-y-1">
                <h2 className="px-2 font-mono-code text-[0.63rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {group.label}
                </h2>
                <ul className="space-y-1">
                  {group.items.map((conv) => {
                    const isActive =
                      !isGlobalVaultActive && activeConversationId === conv.id;
                    const isEditing = editingId === conv.id;

                    return (
                      <li key={conv.id}>
                        {isEditing ? (
                          <div className="flex items-center gap-1 rounded-lg border border-[var(--accent-primary)] bg-[var(--bg-elevated)] p-1">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void commitRename(conv.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                              maxLength={200}
                              aria-label="Edit conversation title"
                              className="w-full bg-transparent px-1.5 py-0.5 text-xs text-[var(--text-primary)] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => void commitRename(conv.id)}
                              aria-label="Save title"
                              className="rounded p-1 text-[var(--accent-grounded)] hover:bg-[var(--bg-subtle)]"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              aria-label="Cancel rename"
                              className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`group flex items-center justify-between gap-1 rounded-xl border px-2.5 py-2 transition-all ${
                              isActive
                                ? 'border-[var(--accent-primary)]/50 bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                                : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/60 hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <Link
                              to={`/c/${conv.id}`}
                              onClick={onCloseMobile}
                              onDoubleClick={(e) => startEditing(conv, e)}
                              className="flex flex-1 items-center gap-2 min-w-0 no-underline text-inherit"
                            >
                              <MessageSquare
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  isActive
                                    ? 'text-[var(--accent-primary)]'
                                    : 'text-[var(--text-muted)]'
                                }`}
                                aria-hidden="true"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">
                                  {conv.title || 'New conversation'}
                                </p>
                                <p className="font-mono-code text-[0.62rem] text-[var(--text-muted)]">
                                  {formatRelativeTime(conv.updatedAt)}
                                </p>
                              </div>
                            </Link>

                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => startEditing(conv, e)}
                                aria-label={`Rename ${conv.title}`}
                                title="Rename session"
                                className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                              >
                                <Pencil className="h-3 w-3" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setConvPendingDelete(conv);
                                }}
                                aria-label={`Delete ${conv.title}`}
                                title="Delete session"
                                className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--status-danger-soft)] hover:text-[var(--status-danger)]"
                              >
                                <Trash2 className="h-3 w-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </nav>

        {/* User Footer */}
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary-soft)] font-mono-code text-xs font-bold uppercase text-[var(--accent-primary)]">
                {(username || 'U').slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                  {username || 'Researcher'}
                </p>
                <p className="font-mono-code text-[0.62rem] text-[var(--accent-grounded)]">
                  SESSION AUTHENTICATED
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void onLogout()}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-[var(--text-secondary)] hover:border-[var(--status-danger)] hover:text-[var(--status-danger)] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={Boolean(convPendingDelete)}
        title="Delete Research Session & Vault?"
        description={
          convPendingDelete
            ? `Deleting "${convPendingDelete.title}" will permanently remove all chat messages, attached Vault documents, pgvector chunks, and MinIO objects for this conversation.`
            : ''
        }
        confirmLabel="Delete Session & Vault"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConvPendingDelete(null)}
      />
    </>
  );
}
