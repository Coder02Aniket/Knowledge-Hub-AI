import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { useConversations } from '../../hooks/useConversations';

interface AppShellProps {
  children: (shellProps: {
    openMobileSidebar: () => void;
    activeConversationId: string | null;
  }) => React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { username, logout } = useAuth();
  const {
    conversations,
    renameConversation,
    deleteConversation,
    isDeleting,
  } = useConversations(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleCreateNewChat = async () => {
    navigate('/');
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Sidebar
        conversations={conversations}
        activeConversationId={conversationId ?? null}
        username={username}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onCreateNewChat={handleCreateNewChat}
        onRenameConversation={(id, title) => renameConversation({ id, title })}
        onDeleteConversation={(id) => deleteConversation(id)}
        onLogout={async () => {
          await logout();
          navigate('/login');
        }}
        isDeleting={isDeleting}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {children({
          openMobileSidebar: () => setMobileSidebarOpen(true),
          activeConversationId: conversationId ?? null,
        })}
      </div>
    </div>
  );
}
