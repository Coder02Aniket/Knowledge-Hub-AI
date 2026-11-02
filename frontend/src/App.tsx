import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './components/ui/ThemeProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import { AppShell } from './components/layout/AppShell';
import { AuthPage } from './pages/AuthPage';
import { ChatWorkspacePage } from './pages/ChatWorkspacePage';
import { GlobalVaultPage } from './pages/GlobalVaultPage';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <div className="flex items-center gap-2.5 font-mono-code text-xs text-[var(--accent-primary)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>INITIALIZING OBSERVATORY SESSION...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <AuthPage initialMode="login" />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <AuthPage initialMode="register" />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/"
        element={
          <AuthGuard>
            <AppShell>
              {({ openMobileSidebar, activeConversationId }) => (
                <ChatWorkspacePage
                  activeConversationId={activeConversationId}
                  onOpenMobileSidebar={openMobileSidebar}
                />
              )}
            </AppShell>
          </AuthGuard>
        }
      />
      <Route
        path="/c/:conversationId"
        element={
          <AuthGuard>
            <AppShell>
              {({ openMobileSidebar, activeConversationId }) => (
                <ChatWorkspacePage
                  activeConversationId={activeConversationId}
                  onOpenMobileSidebar={openMobileSidebar}
                />
              )}
            </AppShell>
          </AuthGuard>
        }
      />
      <Route
        path="/vault"
        element={
          <AuthGuard>
            <AppShell>
              {({ openMobileSidebar }) => (
                <GlobalVaultPage onOpenMobileSidebar={openMobileSidebar} />
              )}
            </AppShell>
          </AuthGuard>
        }
      />
      <Route path="/documents" element={<Navigate to="/vault" replace />} />
      <Route path="/chat" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter basename="/knowledgehub">
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
