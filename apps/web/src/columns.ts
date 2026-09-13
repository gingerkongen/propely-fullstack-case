import type { Task } from './types';

import { CATEGORY_LABELS, STATUS_LABELS } from './labels';

export interface TaskColumn {
  header: string;
  /** The cell text. The table and the PDF both use it, so they always show the same values. */
  text: (task: Task) => string;
  /** Tailwind classes for the table cell. */
  className: string;
}

export const TASK_COLUMNS: TaskColumn[] = [
  { header: 'ID', text: (task) => task.id, className: 'whitespace-nowrap font-mono text-xs text-slate-500' },
  { header: 'Tittel', text: (task) => task.title, className: '' },
  // Descriptions may contain line breaks from the old system; pre-line keeps them.
  { header: 'Beskrivelse', text: (task) => task.description, className: 'whitespace-pre-line text-slate-600' },
  { header: 'Kategori', text: (task) => CATEGORY_LABELS[task.category], className: 'whitespace-nowrap' },
  { header: 'Status', text: (task) => STATUS_LABELS[task.status], className: 'whitespace-nowrap' },
  // Some property names are 70+ chars, so let them wrap.
  { header: 'Eiendom', text: (task) => task.property_name, className: 'min-w-48' },
  { header: 'Opprettet', text: (task) => task.created_at, className: 'whitespace-nowrap text-slate-600' },
  { header: 'Frist', text: (task) => task.due_date ?? '—', className: 'whitespace-nowrap text-slate-600' },
  {
    header: 'Kostnad (NOK)',
    text: (task) => (task.cost_nok === null ? '—' : String(task.cost_nok)),
    className: 'whitespace-nowrap text-right',
  },
];
