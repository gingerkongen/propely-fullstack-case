import { useEffect, useState } from 'react';

import type { FilterOptions, TaskFilter, TaskSearchResult } from './types';

import { fetchFilterOptions, searchTasks } from './api';
import { EMPTY_FILTER, TaskFilters } from './TaskFilters';
import { TaskTable } from './TaskTable';
import { useDebouncedValue } from './useDebouncedValue';

const toMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function App() {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [filter, setFilter] = useState<TaskFilter>(EMPTY_FILTER);
  const [result, setResult] = useState<TaskSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFilterOptions()
      .then(setOptions)
      .catch((err: unknown) => setError(toMessage(err)));
  }, []);

  // Typing in the search or cost fields changes the filter on every keystroke; search once it pauses.
  const debouncedFilter = useDebouncedValue(filter, 250);

  useEffect(() => {
    // Abort the previous search so a slow, outdated response can't overwrite a newer one.
    const controller = new AbortController();
    searchTasks(debouncedFilter, controller.signal)
      .then((next) => {
        setResult(next);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(toMessage(err));
      });
    return () => controller.abort();
  }, [debouncedFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Vedlikeholdsoppgaver</h1>
        <p className="text-sm text-slate-500">
          {result ? `${result.total} oppgaver` : 'Laster oppgaver …'}
        </p>
      </header>

      <main className="p-6">
        {options && <TaskFilters options={options} filter={filter} onChange={setFilter} />}

        {error && (
          <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Kunne ikke hente oppgaver: {error}
          </div>
        )}

        {!error && !result && <p className="text-sm text-slate-500">Laster …</p>}

        {result &&
          (result.items.length > 0 ? (
            <TaskTable tasks={result.items} />
          ) : (
            <p className="text-sm text-slate-500">Ingen oppgaver matcher filtrene.</p>
          ))}
      </main>
    </div>
  );
}
