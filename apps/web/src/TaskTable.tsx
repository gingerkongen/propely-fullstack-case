import type { Task } from './types';

import { TASK_COLUMNS } from './columns';

/** Renders the given tasks. Filtering and sorting (newest first) happen in the API. */
export function TaskTable({ tasks }: { tasks: Task[] }) {
  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {TASK_COLUMNS.map((column) => (
              <th key={column.header} className="whitespace-nowrap px-3 py-2 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t border-slate-200 align-top">
              {TASK_COLUMNS.map((column) => (
                <td key={column.header} className={`px-3 py-2 ${column.className}`}>
                  {column.text(task)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
