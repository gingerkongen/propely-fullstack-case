import type { FilterOptions, Pagination, TaskFilter, TaskSearchResult } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`API responded with ${response.status}`);
  }
  return (await response.json()) as T;
}

export function fetchFilterOptions(): Promise<FilterOptions> {
  return request('/api/tasks/filter-options');
}

export function searchTasks(
  query: TaskFilter & Pagination,
  signal?: AbortSignal,
): Promise<TaskSearchResult> {
  return request('/api/tasks/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
    signal,
  });
}
