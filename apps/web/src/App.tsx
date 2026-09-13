import { useEffect, useState } from 'react';

import type { Task } from './types';

import { fetchTasks } from './api';
import { TaskTable } from './TaskTable';

export function App() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [taskCount, setTaskCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks()
      .then((result) => {
        setTasks(result);
        setTaskCount(result.length);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Vedlikeholdsoppgaver</h1>
        <p className="text-sm text-slate-500">
          {tasks ? `${taskCount} oppgaver` : 'Laster oppgaver …'}
        </p>
      </header>

      <main className="p-6">
        {error && (
          <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Kunne ikke hente oppgaver: {error}
          </div>
        )}

        {!error && !tasks && <p className="text-sm text-slate-500">Laster …</p>}

        {tasks && <TaskTable tasks={tasks} />}
      </main>
    </div>
  );
}
