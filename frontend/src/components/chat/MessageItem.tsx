import { useState } from 'react';
import type { MessageView, SourceView } from '../../types';
import { cn } from '../../lib/utils';
import { RetrievalBadge } from './RetrievalBadge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface MessageItemProps {
  message: MessageView;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'USER';

  return (
    <div className={cn("flex gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium shadow-sm border",
        isUser 
          ? "bg-primary text-primary-foreground border-primary/20" 
          : "bg-card text-foreground border-border"
      )}>
        {isUser ? <User size={16} /> : <Bot size={18} />}
      </div>

      <div className={cn("max-w-[85%] flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-card text-foreground border border-border rounded-tl-sm prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-secondary prose-pre:border prose-pre:border-border"
        )}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : message.failed ? (
            <div className="text-destructive font-medium flex items-center gap-2">
              <span>{message.failureReason || 'Failed to generate a response.'}</span>
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {message.sources.map((source, idx) => (
              <SourceReference key={`${source.documentId}-${idx}`} source={source} index={idx + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SourceReference({ source, index }: { source: SourceView, index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative group flex items-center gap-1.5">
      <button 
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors",
          expanded 
            ? "bg-secondary text-foreground border-border shadow-sm" 
            : "bg-background text-muted-foreground border-border hover:bg-secondary/50"
        )}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
          {index}
        </span>
        <span className="truncate max-w-[120px]" title={source.documentName}>{source.documentName}</span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      <RetrievalBadge method={source.retrievalMethod} />

      {expanded && (
        <div className="absolute z-10 top-full mt-2 left-0 w-72 md:w-96 bg-popover border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 bg-secondary/30 border-b border-border flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2 text-foreground truncate">
              <FileText size={14} className="text-muted-foreground shrink-0" />
              <span className="truncate">{source.documentName}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {source.locationLabel && <span className="text-muted-foreground">{source.locationLabel}</span>}
              {source.scoreLabel && <span className="bg-background px-1.5 py-0.5 rounded text-primary border border-border shadow-sm">{source.scoreLabel} match</span>}
            </div>
          </div>
          <div className="p-3 max-h-48 overflow-y-auto text-xs text-foreground/90 leading-relaxed bg-card">
            {source.snippet}
          </div>
        </div>
      )}
    </div>
  );
}
