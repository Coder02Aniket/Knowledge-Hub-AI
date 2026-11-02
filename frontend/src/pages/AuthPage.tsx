import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Database,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../components/ui/ThemeProvider';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const navigate = useNavigate();
  const { login, isLoggingIn, register, isRegistering } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isBusy = isLoggingIn || isRegistering;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 40) {
      setFormError('Username must be between 3 and 40 characters.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 8) {
        setFormError('Password must be at least 8 characters long.');
        return;
      }
      if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
        setFormError('Please enter a valid email address.');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login({ username: cleanUsername, password });
      } else {
        await register({
          username: cleanUsername,
          email: email.trim(),
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        });
      }
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.'
      );
    }
  };

  return (
    <div className="min-h-dvh w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] bg-archival-grid flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <span className="block font-display text-base font-bold tracking-tight">
              KnowledgeHub AI
            </span>
            <span className="block font-mono-code text-[0.65rem] uppercase tracking-widest text-[var(--text-muted)]">
              Retrieval-Augmented Research Platform
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Split-Screen Editorial Layout */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 flex items-center">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12 items-center">
          {/* Left Column: Monograph Manifesto */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] px-3 py-1 font-mono-code text-[0.7rem] font-semibold text-[var(--accent-primary)]">
              <span>SPRING AI · PGVECTOR COSINE RETRIEVAL · MINIO VAULT</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.12] text-[var(--text-primary)]">
              Where archival documents become verifiable intelligence.
            </h1>

            <p className="max-w-xl text-base text-[var(--text-secondary)] leading-relaxed">
              KnowledgeHub AI pairs isolated per-conversation Document Vaults with strict citation
              grounding. Upload PDFs, Markdown monographs, CSV tables, or JSON schemas and inspect
              every <code className="font-mono-code text-[var(--accent-primary)]">[1]</code> source
              down to the exact page number, chunk index, and similarity score.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <Database className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden="true" />
                <h2 className="mt-2 font-display text-sm font-semibold">768-Dim pgvector</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Asynchronous PDFBox & text chunking with SHA-256 deduplication.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <BookOpen className="h-5 w-5 text-[var(--accent-grounded)]" aria-hidden="true" />
                <h2 className="mt-2 font-display text-sm font-semibold">Citation Inspector</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Verify verbatim 300-char excerpts, page numbers, and cosine match scores.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <ShieldCheck className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden="true" />
                <h2 className="mt-2 font-display text-sm font-semibold">Scoped Vaults</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Private S3-compatible MinIO storage per user and research session.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Auth Form Card */}
          <div className="lg:col-span-5">
            <div
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 sm:p-8"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              {/* Mode Switch Tabs */}
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="grid grid-cols-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 mb-6"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  onClick={() => {
                    setMode('login');
                    setFormError(null);
                  }}
                  className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  onClick={() => {
                    setMode('register');
                    setFormError(null);
                  }}
                  className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs"
                  style={{
                    backgroundColor: 'var(--status-danger-soft)',
                    borderColor: 'var(--status-danger)',
                    color: 'var(--status-danger)',
                  }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="auth-username"
                    className="block font-mono-code text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                  >
                    Username
                  </label>
                  <input
                    id="auth-username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="researcher_01"
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </div>

                {mode === 'register' && (
                  <>
                    <div>
                      <label
                        htmlFor="auth-email"
                        className="block font-mono-code text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                      >
                        Email Address
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ada@observatory.org"
                        className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="auth-firstname"
                          className="block font-mono-code text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                        >
                          First Name
                        </label>
                        <input
                          id="auth-firstname"
                          type="text"
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Ada"
                          className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="auth-lastname"
                          className="block font-mono-code text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                        >
                          Last Name
                        </label>
                        <input
                          id="auth-lastname"
                          type="text"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Lovelace"
                          className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label
                    htmlFor="auth-password"
                    className="block font-mono-code text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                  >
                    Password {mode === 'register' && '(min 8 chars)'}
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-3 text-sm font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>
                        {mode === 'login' ? 'Authenticating...' : 'Creating Workspace...'}
                      </span>
                    </>
                  ) : (
                    <span>
                      {mode === 'login'
                        ? 'Enter Research Observatory'
                        : 'Create Account & Sign In'}
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
