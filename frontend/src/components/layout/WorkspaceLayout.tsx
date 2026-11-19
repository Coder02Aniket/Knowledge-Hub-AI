import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useConversationStore } from '../../store/conversationStore';
import { 
  LogOut, 
  MessageSquare, 
  Files, 
  Plus, 
  Library, 
  PanelLeftClose, 
  PanelLeft, 
  Trash2, 
  Edit2, 
  Check, 
  X 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function WorkspaceLayout() {
  const { logout, username } = useAuthStore();
  const { 
    conversations, 
    fetchConversations, 
    activeConversationId, 
    setActiveConversation, 
    deleteConversation, 
    renameConversation 
  } = useConversationStore();

  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNewChat = async () => {
    setActiveConversation(null);
    navigate('/chat');
  };

  const handleDeleteChat = async (id: string, title: string) => {
    const confirm = window.confirm(`Delete "${title || 'this chat'}"? All messages and attached documents will be removed.`);
    if (confirm) {
      await deleteConversation(id);
      if (activeConversationId === id) {
        navigate('/chat');
      }
    }
  };

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingConvId(id);
    setEditTitle(currentTitle || 'Untitled');
  };

  const handleSaveRename = async (id: string) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingConvId(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div 
        className={cn(
          "flex-shrink-0 flex flex-col border-r border-border bg-secondary/30 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden border-none opacity-0"
        )}
      >
        <div className="h-14 flex items-center px-4 justify-between border-b border-border">
          <Link to="/chat" className="flex items-center gap-2 font-medium tracking-tight">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground shadow-sm">
              <Library size={14} />
            </div>
            <span className="font-semibold text-foreground">KnowledgeHub</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="text-muted-foreground hover:text-foreground md:hidden p-1 rounded-md"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-foreground bg-background border border-border shadow-xs hover:bg-muted transition-colors"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          <div className="space-y-1">
            <Link
              to="/documents"
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors",
                location.pathname.startsWith('/documents')
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <Files size={18} />
              Knowledge Library
            </Link>
          </div>

          <div className="space-y-1">
            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Recent Chats
            </div>
            {conversations.length === 0 ? (
              <div className="px-3 text-xs text-muted-foreground py-2">No conversations yet</div>
            ) : (
              <div className="space-y-1">
                {conversations.map(chat => (
                  <div
                    key={chat.conversationId}
                    className={cn(
                      "group relative flex items-center justify-between rounded-xl transition-colors",
                      activeConversationId === chat.conversationId
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    {editingConvId === chat.conversationId ? (
                      <div className="flex items-center gap-1.5 px-2 py-1.5 w-full">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(chat.conversationId);
                            if (e.key === 'Escape') setEditingConvId(null);
                          }}
                          className="flex-1 bg-background text-xs px-2 py-1 rounded border border-primary focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(chat.conversationId)}
                          className="p-1 hover:text-foreground text-muted-foreground"
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingConvId(null)}
                          className="p-1 hover:text-foreground text-muted-foreground"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Link
                          to={`/chat/${chat.conversationId}`}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs truncate flex-1 min-w-0"
                        >
                          <MessageSquare 
                            size={14} 
                            className={cn(
                              "flex-shrink-0", 
                              activeConversationId === chat.conversationId ? "text-primary" : "text-muted-foreground"
                            )} 
                          />
                          <span className="truncate">{chat.title || 'Untitled Chat'}</span>
                        </Link>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pr-2 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleStartRename(chat.conversationId, chat.title);
                            }}
                            className="p-1 hover:text-foreground text-muted-foreground rounded transition-colors"
                            title="Rename chat"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteChat(chat.conversationId, chat.title);
                            }}
                            className="p-1 hover:text-destructive text-muted-foreground rounded transition-colors"
                            title="Delete chat"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0 text-xs">
                {username?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium truncate text-foreground">{username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="h-14 flex items-center px-4 border-b border-border gap-4 flex-shrink-0">
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-secondary"
            >
              <PanelLeft size={18} />
            </button>
          )}
          <div className="font-semibold text-sm text-foreground">
            {location.pathname.startsWith('/documents') ? 'Knowledge Library' : 'Chat Workspace'}
          </div>
        </div>
        <main className="flex-1 overflow-hidden relative flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
