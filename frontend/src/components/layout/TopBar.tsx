import React, { useState } from 'react';
import {
  Menu,
  Database,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
  Pencil,
  Check,
  X,
  BookOpen,
} from 'lucide-react';
import { useTheme } from '../ui/ThemeProvider';

interface TopBarProps {
  title: string;
  canRename: boolean;
  onRename?: (newTitle: string) => Promise<void>;
  completedDocsCount: number;
  totalDocsCount: number;
  isVaultOpen?: boolean;
  onToggleVault?: () => void;
  hasActiveCitation?: boolean;
  onOpenMobileSidebar: () => void;
}

export function TopBar({
  title,
  canRename,
  onRename,
  completedDocsCount,
  totalDocsCount,
  isVaultOpen = false,
  onToggleVault,
  hasActiveCitation = false,
  onOpenMobileSidebar,
}: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  const handleCommitRename = async () => {
    setIsEditing(false);
    const trimmed = draftTitle.trim();
    if (!trimmed || !onRename || trimmed === title) return;
    await onRename(trimmed);
  };

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>

        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCommitRename();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              autoFocus
              maxLength={200}
              aria-label="Conversation title"
              className="rounded-lg border border-[var(--accent-primary)] bg-[var(--bg-elevated)] px-2.5 py-1 text-sm font-semibold text-[var(--text-primary)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleCommitRename()}
              aria-label="Save conversation title"
              className="rounded-lg p-1.5 text-[var(--accent-grounded)] hover:bg-[var(--bg-subtle)]"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              aria-label="Cancel editing title"
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="truncate font-display text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h1>
            {canRename && onRename && (
              <button
                type="button"
                onClick={() => {
                  setDraftTitle(title);
                  setIsEditing(true);
                }}
                aria-label="Rename conversation"
                title="Rename conversation"
                className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Instrument Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Live Grounding Telemetry Badge */}
        {completedDocsCount > 0 ? (
          <span
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono-code text-[0.68rem] font-semibold"
            style={{
              backgroundColor: 'var(--accent-grounded-soft)',
              borderColor: 'var(--accent-grounded)',
              color: 'var(--accent-grounded)',
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>RAG GROUNDED · {completedDocsCount} READY</span>
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 font-mono-code text-[0.68rem] text-[var(--text-muted)]">
            <Sparkles className="h-3 w-3 text-[var(--accent-primary)]" aria-hidden="true" />
            <span>GENERAL MODE</span>
          </span>
        )}

        {hasActiveCitation && (
          <span className="hidden lg:inline-flex items-center gap-1 rounded-lg border border-[var(--accent-primary)]/50 bg-[var(--accent-primary-soft)] px-2.5 py-1 font-mono-code text-[0.68rem] font-semibold text-[var(--accent-primary)]">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>INSPECTING SOURCE</span>
          </span>
        )}

        {onToggleVault && (
          <button
            type="button"
            onClick={onToggleVault}
            aria-expanded={isVaultOpen}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              isVaultOpen
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
            }`}
          >
            <Database className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Vault ({totalDocsCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to daylight vellum theme' : 'Switch to dark obsidian theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}
