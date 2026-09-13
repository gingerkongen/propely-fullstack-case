import type { ReactNode } from 'react';

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
}

/** "Viser 51–100 av 230" with first / previous / next / last buttons. */
export function Pagination({ total, page, pageSize, onChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Sider"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"
    >
      <p>
        Viser {first}–{last} av {total}
      </p>
      <div className="flex items-center gap-1">
        <PageButton label="Første side" disabled={page <= 1} onClick={() => onChange(1)}>
          «
        </PageButton>
        <PageButton label="Forrige side" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ‹ Forrige
        </PageButton>
        <span className="px-2">
          Side {page} av {pageCount}
        </span>
        <PageButton label="Neste side" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
          Neste ›
        </PageButton>
        <PageButton label="Siste side" disabled={page >= pageCount} onClick={() => onChange(pageCount)}>
          »
        </PageButton>
      </div>
    </nav>
  );
}

interface PageButtonProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

function PageButton({ label, disabled, onClick, children }: PageButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
    >
      {children}
    </button>
  );
}
