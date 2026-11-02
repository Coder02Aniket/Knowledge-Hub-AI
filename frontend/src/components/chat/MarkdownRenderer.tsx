import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Check, Copy, Terminal } from 'lucide-react';
import type { SourceView } from '../../types/api';
import { CitationBadge } from './CitationBadge';

interface MarkdownRendererProps {
  content: string;
  sources?: SourceView[];
  activeCitationIndex?: number | null;
  onSelectCitation?: (index: number, source?: SourceView) => void;
}

const CITATION_REGEX = /\[(\d+)\]/g;

function renderTextWithCitations(
  text: string,
  sources: SourceView[],
  activeCitationIndex: number | null | undefined,
  onSelectCitation?: (index: number, source?: SourceView) => void
): React.ReactNode {
  if (!text.includes('[')) return text;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(CITATION_REGEX);

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    const num = Number.parseInt(match[1], 10);
    const start = match.index;

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    const matchedSource = num >= 1 && num <= sources.length ? sources[num - 1] : undefined;

    if (onSelectCitation && (matchedSource || sources.length > 0)) {
      parts.push(
        <CitationBadge
          key={`cit-${start}-${num}`}
          index={num}
          source={matchedSource}
          isActive={activeCitationIndex === num}
          onSelect={onSelectCitation}
        />
      );
    } else {
      parts.push(fullMatch);
    }

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : parts;
}

function processChildrenWithCitations(
  children: React.ReactNode,
  sources: SourceView[],
  activeCitationIndex: number | null | undefined,
  onSelectCitation?: (index: number, source?: SourceView) => void
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return renderTextWithCitations(child, sources, activeCitationIndex, onSelectCitation);
    }
    return child;
  });
}

function CodeBlock({
  language,
  value,
}: {
  language: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[#0a0c0b] text-[#e6e4dd]">
      <div className="flex items-center justify-between border-b border-[#222925] bg-[#111513] px-3.5 py-1.5">
        <div className="flex items-center gap-1.5 font-mono-code text-[0.7rem] text-[#939088]">
          <Terminal className="h-3.5 w-3.5 text-[#e5a93c]" aria-hidden="true" />
          <span>{language || 'code'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code block"
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono-code text-[0.68rem] text-[#c4c0b7] hover:bg-[#1f2622] hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[#2dd4bf]" aria-hidden="true" />
              <span className="text-[#2dd4bf]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" aria-hidden="true" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono-code text-xs leading-relaxed">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  sources = [],
  activeCitationIndex,
  onSelectCitation,
}: MarkdownRendererProps) {
  return (
    <div className="khub-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          p({ children }) {
            return (
              <p>
                {processChildrenWithCitations(
                  children,
                  sources,
                  activeCitationIndex,
                  onSelectCitation
                )}
              </p>
            );
          },
          li({ children }) {
            return (
              <li>
                {processChildrenWithCitations(
                  children,
                  sources,
                  activeCitationIndex,
                  onSelectCitation
                )}
              </li>
            );
          },
          td({ children }) {
            return (
              <td>
                {processChildrenWithCitations(
                  children,
                  sources,
                  activeCitationIndex,
                  onSelectCitation
                )}
              </td>
            );
          },
          code(props) {
            const { children, className } = props;
            const match = /language-(\w+)/.exec(className || '');
            const rawText = String(children).replace(/\n$/, '');
            const isBlock = Boolean(match) || rawText.includes('\n');

            if (isBlock) {
              return <CodeBlock language={match ? match[1] : ''} value={rawText} />;
            }

            return (
              <code className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono-code text-[0.82em] text-[var(--accent-primary)]">
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
