/**
 * Task domain types for the API.
 *
 * The same enum values are mirrored by CHECK constraints in the SQLite schema
 * (apps/api/src/db.ts).
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

/** A single task, exactly as stored in SQLite. */
export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  property_id: string;
  /** ISO 8601 date, e.g. "2024-03-11". */
  created_at: string;
  /** ISO 8601 date, or null. */
  due_date: string | null;
  cost_nok: number | null;
}

/** A task joined with the name of its property, as returned by the API. */
export interface TaskWithProperty extends Task {
  property_name: string;
}

/** A property that tasks belong to, as stored in SQLite. */
export interface Property {
  id: string;
  name: string;
}
