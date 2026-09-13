import { useState } from 'react';

import type { FilterOptions, TaskFilter, TaskSearchResult } from './types';

import { searchTasks } from './api';
import { downloadTasksPdf } from './exportPdf';
import { describeFilter } from './TaskFilters';

// The API's page_size cap. It covers the whole dataset, so "all" is a single request.
const MAX_PAGE_SIZE = 1000;

const buttonClass =
  'rounded border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-50';

interface PdfExportProps {
  /** The page on screen. */
  result: TaskSearchResult;
  /** The filter that produced `result` (not what's being typed), so the PDF matches the screen. */
  filter: TaskFilter;
  options: FilterOptions;
}

/** Downloads the rows on screen, or every row matching the same filter, as a PDF. */
export function PdfExport({ result, filter, options }: PdfExportProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items, total, page, page_size } = result;

  const download = async (scope: 'page' | 'all') => {
    setBusy(true);
    setError(null);
    try {
      let tasks = items;
      const first = (page - 1) * page_size + 1;
      let description = `Side ${page} av ${Math.ceil(total / page_size)} (oppgave ${first}–${first + items.length - 1} av ${total})`;
      if (scope === 'all') {
        const all = await searchTasks({ ...filter, page: 1, page_size: MAX_PAGE_SIZE });
        // Fail loudly rather than export a partial list if the data ever outgrows one request.
        if (all.items.length < all.total) {
          throw new Error(`${all.total} oppgaver er for mange for én eksport`);
        }
        tasks = all.items;
        description = `Alle ${all.total} oppgaver`;
      }
      await downloadTasksPdf({ tasks, scope: description, filters: describeFilter(filter, options) });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-500">{busy ? 'Lager PDF …' : 'Last ned PDF:'}</span>
      <button type="button" disabled={busy} onClick={() => download('page')} className={buttonClass}>
        Denne siden ({items.length})
      </button>
      <button type="button" disabled={busy} onClick={() => download('all')} className={buttonClass}>
        Alle treff ({total})
      </button>
      {error && <span className="text-red-700">Kunne ikke lage PDF: {error}</span>}
    </div>
  );
}
