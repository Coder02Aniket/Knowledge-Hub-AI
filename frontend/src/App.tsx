import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/Login';
import { WorkspaceLayout } from './components/layout/WorkspaceLayout';
import { ChatWorkspace } from './pages/ChatWorkspace';
import { DocumentsLibrary } from './pages/DocumentsLibrary';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  const { checkStatus } = useAuthStore();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return (
    <BrowserRouter basename="/knowledgehub">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><WorkspaceLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/chat" />} />
          <Route path="chat" element={<ChatWorkspace />} />
          <Route path="chat/:id" element={<ChatWorkspace />} />
          <Route path="documents" element={<DocumentsLibrary />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
