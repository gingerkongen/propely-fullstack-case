import type { Task } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// Tasks change rarely, so we only hit the API once per session.
let cache: Task[] | null = null;

export async function fetchTasks(): Promise<any> {
  if (cache) return cache;

  const response = await fetch(`${API_BASE_URL}/api/tasks`);
  cache = await response.json();

  return cache;
}
