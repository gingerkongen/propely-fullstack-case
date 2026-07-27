import type { Task } from './types';

const COLUMNS = [
  'ID',
  'Tittel',
  'Beskrivelse',
  'Kategori',
  'Status',
  'Eiendom (id)',
  'Opprettet',
  'Frist',
  'Kostnad (NOK)',
] as const;

/** Renders every task in a plain table. No filtering or pagination. */
export function TaskTable({ tasks }: { tasks: Task[] }) {
  // Newest first.
  const rows = tasks.sort((a, b) => b.created_at.localeCompare(a.created_at));

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
          {rows.map((task, index) => (
            <tr key={index} className="border-t border-slate-200 align-top">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">
                {task.id}
              </td>
              <td className="px-3 py-2">{task.title}</td>
              {/* Descriptions may contain line breaks from the old system. */}
              <td
                className="px-3 py-2 text-slate-600"
                dangerouslySetInnerHTML={{ __html: task.description.replace(/\n/g, '<br />') }}
              />
              <td className="whitespace-nowrap px-3 py-2">{task.category}</td>
              <td className="whitespace-nowrap px-3 py-2">{task.status}</td>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">
                {task.property_id}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{task.created_at}</td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{task.due_date ?? '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right">{task.cost_nok || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
