import { useEffect, useMemo, useState } from 'react';

import type { FilterOptions, TaskFilter, TaskSearchResult } from './types';

import { fetchFilterOptions, searchTasks } from './api';
import { Pagination } from './Pagination';
import { EMPTY_FILTER, TaskFilters } from './TaskFilters';
import { TaskTable } from './TaskTable';
import { useDebouncedValue } from './useDebouncedValue';

const PAGE_SIZE = 50;

const toMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function App() {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [filter, setFilter] = useState<TaskFilter>(EMPTY_FILTER);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<TaskSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A new filter means a new set of rows, so start again from the first page.
  const changeFilter = (next: TaskFilter) => {
    setFilter(next);
    setPage(1);
  };

  const changePage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    fetchFilterOptions()
      .then(setOptions)
      .catch((err: unknown) => setError(toMessage(err)));
  }, []);

  // Typing in the search or cost fields changes the filter on every keystroke; search once it pauses.
  // Filter and page are debounced together, so a filter change and its reset to page 1 send one request.
  const query = useMemo(() => ({ ...filter, page, page_size: PAGE_SIZE }), [filter, page]);
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    // Abort the previous search so a slow, outdated response can't overwrite a newer one.
    const controller = new AbortController();
    searchTasks(debouncedQuery, controller.signal)
      .then((next) => {
        setResult(next);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(toMessage(err));
      });
    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Vedlikeholdsoppgaver</h1>
        <p className="text-sm text-slate-500">
          {result ? `${result.total} oppgaver` : 'Laster oppgaver …'}
        </p>
      </header>

      <main className="p-6">
        {options && <TaskFilters options={options} filter={filter} onChange={changeFilter} />}

        {error && (
          <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Kunne ikke hente oppgaver: {error}
          </div>
        )}

        {!error && !result && <p className="text-sm text-slate-500">Laster …</p>}

        {result &&
          (result.items.length > 0 ? (
            <>
              <TaskTable tasks={result.items} />
              <Pagination
                total={result.total}
                page={result.page}
                pageSize={result.page_size}
                onChange={changePage}
              />
            </>
          ) : (
            <p className="text-sm text-slate-500">Ingen oppgaver matcher filtrene.</p>
          ))}
      </main>
    </div>
  );
}
