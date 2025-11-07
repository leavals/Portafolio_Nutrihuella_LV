// src/components/Pagination.tsx
'use client';

import React from 'react';
import clsx from 'clsx';

type Props = {
  page: number;            // 1-based
  pageSize: number;
  total: number;           // total de registros
  onPageChange: (next: number) => void;
  className?: string;
};

function usePages(page: number, pageCount: number) {
  // Regla simple: mostrar hasta 7 controles (primer/último con elipsis)
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const pages: (number | '…')[] = [];
  const add = (p: number | '…') => pages.push(p);

  add(1);
  if (page > 4) add('…');

  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  for (let p = start; p <= end; p++) add(p);

  if (page < pageCount - 3) add('…');
  add(pageCount);

  return pages;
}

export default function Pagination({ page, pageSize, total, onPageChange, className }: Props) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const pages = usePages(page, pageCount);

  const go = (p: number) => {
    if (p < 1 || p > pageCount || p === page) return;
    onPageChange(p);
  };

  return (
    <nav
      className={clsx(
        'flex items-center justify-center gap-1 text-sm select-none',
        className
      )}
      aria-label="Paginación"
    >
      <button
        className="px-2 py-1 rounded-lg border bg-white/80 hover:bg-white disabled:opacity-50"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        «
      </button>

      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`e-${idx}`} className="px-2 py-1 text-slate-500">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => go(p)}
            aria-current={p === page ? 'page' : undefined}
            className={clsx(
              'px-3 py-1 rounded-lg border',
              p === page
                ? 'bg-[--nh-primary] text-white border-[--nh-primary]'
                : 'bg-white/80 hover:bg-white'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        className="px-2 py-1 rounded-lg border bg-white/80 hover:bg-white disabled:opacity-50"
        onClick={() => go(page + 1)}
        disabled={page >= pageCount}
        aria-label="Página siguiente"
      >
        »
      </button>
    </nav>
  );
}
