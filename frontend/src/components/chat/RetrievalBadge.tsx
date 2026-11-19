import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export type RetrievalKind = 'vector' | 'keyword' | 'grep' | 'hybrid' | 'fused';

interface RetrievalStyle {
  label: string;
  dot: string;
  text: string;
  description: string;
}

const RETRIEVAL_STYLES: Record<RetrievalKind, RetrievalStyle> = {
  vector: {
    label: 'Vector',
    dot: 'bg-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-300',
    description: 'Found by semantic vector search over the stored embeddings.',
  },
  keyword: {
    label: 'Keyword',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    description: 'Found by keyword search over the stored text.',
  },
  grep: {
    label: 'Grep',
    dot: 'bg-lime-500',
    text: 'text-lime-700 dark:text-lime-300',
    description: 'Found by literal line grep over the extracted text.',
  },
  hybrid: {
    label: 'Hybrid',
    dot: 'bg-violet-500',
    text: 'text-violet-700 dark:text-violet-300',
    description: 'Found by more than one retrieval method.',
  },
  fused: {
    label: 'Fused',
    dot: 'bg-zinc-400',
    text: 'text-muted-foreground',
    description: 'Ranked after fusing the retrieval lists.',
  },
};

function classify(method: string | undefined): RetrievalKind | null {
  const tiers = (method ?? '')
    .toUpperCase()
    .split('+')
    .map((t) => t.trim())
    .filter(Boolean);

  const hasVector = tiers.includes('VECTOR');
  const hasLexical = tiers.includes('LEXICAL');
  const hasGrep = tiers.includes('GREP');
  const tierCount = [hasVector, hasLexical, hasGrep].filter(Boolean).length;

  if (tierCount > 1) {
    return 'hybrid';
  }
  if (hasGrep) {
    return 'grep';
  }
  if (hasVector) {
    return 'vector';
  }
  if (hasLexical) {
    return 'keyword';
  }
  if (tiers.length > 0) {
    return 'fused';
  }
  return null;
}

export function RetrievalBadge({ method }: { method?: string }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const kind = method ? classify(method) : null;
  const style = kind ? RETRIEVAL_STYLES[kind] : null;

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!kind || !style) {
    return null;
  }

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'inline-flex h-5 items-center gap-1.5 rounded-full border border-border bg-background px-2 transition-colors',
          'hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          style.text
        )}
      >
        <span
          className={cn('h-1.5 w-1.5 rounded-full kh-blink', style.dot)}
          aria-hidden="true"
        />
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] leading-none">
          {style.label}
        </span>
      </button>

      {open && (
        <div
          className="absolute z-30 top-full mt-2 left-0 w-60 rounded-xl border border-border bg-popover p-3 text-left shadow-lg"
          role="tooltip"
        >
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', style.dot)} aria-hidden="true" />
            <span className={cn('text-[11px] font-semibold uppercase tracking-[0.14em]', style.text)}>
              {style.label}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {style.description}
          </p>
        </div>
      )}
    </div>
  );
}
