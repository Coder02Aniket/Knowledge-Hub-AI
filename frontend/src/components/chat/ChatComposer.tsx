import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Paperclip, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDocumentStore } from '../../store/documentStore';
import { useConversationStore } from '../../store/conversationStore';

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument, isUploading } = useDocumentStore();
  const { activeConversationId } = useConversationStore();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = () => {
    if (content.trim() && !disabled && !isUploading) {
      onSend(content.trim());
      setContent('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFeedback(null);
      try {
        const doc = await uploadDocument(file, activeConversationId || undefined);
        if (doc.conversationId && doc.conversationId !== activeConversationId) {
          navigate(`/chat/${doc.conversationId}`, { replace: true });
        }
        setFeedback({
          type: 'success',
          message: `"${file.name}" uploaded. Processing for retrieval...`,
        });
        setTimeout(() => setFeedback(null), 5000);
      } catch (err: any) {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Upload failed.';
        setFeedback({
          type: 'error',
          message: msg,
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      {feedback && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border animate-in fade-in slide-in-from-bottom-1 duration-200",
            feedback.type === 'success'
              ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          )}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={14} className="shrink-0" />
          ) : (
            <AlertCircle size={14} className="shrink-0" />
          )}
          <span className="truncate">{feedback.message}</span>
        </div>
      )}

      <div className="relative bg-card border border-border shadow-sm rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
        <div className="flex items-end px-3 py-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors mb-0.5"
            title="Attach document to this conversation"
          >
            {isUploading ? (
              <Loader2 size={18} className="animate-spin text-primary" />
            ) : (
              <Paperclip size={18} />
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.txt,.docx,.md"
          />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isUploading
                ? "Uploading document..."
                : "Ask anything about your documents..."
            }
            className="flex-1 max-h-[200px] min-h-[24px] bg-transparent border-0 focus:ring-0 resize-none py-2 px-3 text-sm text-foreground placeholder-muted-foreground"
            rows={1}
            disabled={disabled}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || disabled || isUploading}
            className={cn(
              "p-2 rounded-full transition-all mb-0.5 ml-2",
              content.trim() && !disabled && !isUploading
                ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
