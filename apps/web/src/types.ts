/**
 * Local copy of the task types, so the web app does not have to reach into the
 * API workspace for them. Keep in sync with the API if the schema changes.
 */

export const TASK_CATEGORIES = [
  'FireSafety',
  'Plumbing',
  'Electrical',
  'Ventilation',
  'Cleaning',
  'Outdoor',
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_STATUSES = ['New', 'InProgress', 'Completed', 'Rejected'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  property_id: string;
  created_at: string;
  due_date: string | null;
  cost_nok: number | null;
}
