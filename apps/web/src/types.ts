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
  property_name: string;
  created_at: string;
  due_date: string | null;
  cost_nok: number | null;
}

export interface Property {
  id: string;
  name: string;
}

/** Body of POST /api/tasks/search. An empty list or a null bound means no filter on that column. */
export interface TaskFilter {
  statuses: TaskStatus[];
  categories: TaskCategory[];
  property_ids: string[];
  /** ISO dates (YYYY-MM-DD), both ends inclusive. */
  created_from: string | null;
  created_to: string | null;
  due_from: string | null;
  due_to: string | null;
  /** Whole kroner, both ends inclusive. */
  cost_min: number | null;
  cost_max: number | null;
}

export interface TaskSearchResult {
  items: Task[];
  total: number;
}

/** Response of GET /api/tasks/filter-options. */
export interface FilterOptions {
  statuses: TaskStatus[];
  categories: TaskCategory[];
  properties: Property[];
}
