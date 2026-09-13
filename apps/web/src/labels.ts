import type { TaskCategory, TaskStatus } from './types';

/** Norwegian display labels for the API's status and category codes. */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  New: 'Ny',
  InProgress: 'Pågår',
  Completed: 'Fullført',
  Rejected: 'Avvist',
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  FireSafety: 'Brannsikkerhet',
  Plumbing: 'Rør',
  Electrical: 'Elektro',
  Ventilation: 'Ventilasjon',
  Cleaning: 'Renhold',
  Outdoor: 'Utendørs',
};
