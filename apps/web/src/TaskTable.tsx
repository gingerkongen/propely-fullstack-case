import type { Task } from './types';

import { CATEGORY_LABELS, STATUS_LABELS } from './labels';

const COLUMNS = [
  'ID',
  'Tittel',
  'Beskrivelse',
  'Kategori',
  'Status',
  'Eiendom',
  'Opprettet',
  'Frist',
  'Kostnad (NOK)',
] as const;

/** Renders the given tasks. Filtering and sorting (newest first) happen in the API. */
export function TaskTable({ tasks }: { tasks: Task[] }) {
  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} className="whitespace-nowrap px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t border-slate-200 align-top">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">
                {task.id}
              </td>
              <td className="px-3 py-2">{task.title}</td>
              {/* Descriptions may contain line breaks from the old system; pre-line keeps them. */}
              <td className="whitespace-pre-line px-3 py-2 text-slate-600">{task.description}</td>
              <td className="whitespace-nowrap px-3 py-2">{CATEGORY_LABELS[task.category]}</td>
              <td className="whitespace-nowrap px-3 py-2">{STATUS_LABELS[task.status]}</td>
              {/* Some property names are 70+ chars, so let them wrap. */}
              <td className="min-w-48 px-3 py-2">{task.property_name}</td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{task.created_at}</td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{task.due_date ?? '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right">{task.cost_nok ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
