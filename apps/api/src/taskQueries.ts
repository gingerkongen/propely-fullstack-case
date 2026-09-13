import type Database from 'better-sqlite3';
import { escapeLike } from './fold.js';
import {
  TASK_CATEGORIES,
  TASK_STATUSES,
  type Property,
  type TaskCategory,
  type TaskStatus,
  type TaskWithProperty,
} from './types.js';

/** An empty list or a null bound means "no filter" on that column. */
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
  /** Free text, matched anywhere in the title or property name, with or without æøå. */
  q: string | null;
}

/** 1-based page number and rows per page. */
export interface Pagination {
  page: number;
  page_size: number;
}

export interface TaskSearchResult extends Pagination {
  items: TaskWithProperty[];
  /** Matches across all pages. */
  total: number;
}

export interface FilterOptions {
  statuses: readonly TaskStatus[];
  categories: readonly TaskCategory[];
  properties: Property[];
}

// One static WHERE clause covers every filter combination. SQLite can't bind arrays, so each
// list arrives as a JSON array and json_each expands it; an empty array disables that condition.
// A null bound disables its condition; once a bound is set, rows with no value (NULL) drop out.
// ISO date strings compare correctly as text. The search folds the query with the same fold()
// that filled the *_search columns, so both sides are compared in the same form.
const FILTERED_TASKS_SQL = `
  FROM tasks t
  JOIN properties p ON p.id = t.property_id
  WHERE (json_array_length(@statuses) = 0     OR t.status      IN (SELECT value FROM json_each(@statuses)))
    AND (json_array_length(@categories) = 0   OR t.category    IN (SELECT value FROM json_each(@categories)))
    AND (json_array_length(@property_ids) = 0 OR t.property_id IN (SELECT value FROM json_each(@property_ids)))
    AND (@created_from IS NULL OR t.created_at >= @created_from)
    AND (@created_to   IS NULL OR t.created_at <= @created_to)
    AND (@due_from     IS NULL OR t.due_date   >= @due_from)
    AND (@due_to       IS NULL OR t.due_date   <= @due_to)
    AND (@cost_min     IS NULL OR t.cost_nok   >= @cost_min)
    AND (@cost_max     IS NULL OR t.cost_nok   <= @cost_max)
    AND (@q IS NULL
         OR t.title_search LIKE '%' || fold(@q) || '%' ESCAPE '\\'
         OR p.name_search  LIKE '%' || fold(@q) || '%' ESCAPE '\\')
`;

// Newest first, with id breaking same-day ties, so every row lands on exactly one page.
const SEARCH_SQL = `
  SELECT t.id, t.title, t.description, t.category, t.status, t.property_id,
         p.name AS property_name, t.created_at, t.due_date, t.cost_nok
  ${FILTERED_TASKS_SQL}
  ORDER BY t.created_at DESC, t.id DESC
  LIMIT @limit OFFSET @offset
`;

// A separate query rather than COUNT(*) OVER () on the page: a page past the end has no rows
// to carry the total.
const COUNT_SQL = `SELECT count(*) AS total ${FILTERED_TASKS_SQL}`;

// Properties without tasks can't narrow the table, so they are not offered as options.
const PROPERTIES_WITH_TASKS_SQL = `
  SELECT p.id, p.name
  FROM properties p
  WHERE EXISTS (SELECT 1 FROM tasks t WHERE t.property_id = p.id)
`;

export function createTaskQueries(db: Database.Database) {
  // Lists are bound as JSON text; the range bounds are bound as they are.
  type SearchParams = Omit<TaskFilter, 'statuses' | 'categories' | 'property_ids'> & {
    statuses: string;
    categories: string;
    property_ids: string;
  };
  const searchStatement = db.prepare<SearchParams & { limit: number; offset: number }, TaskWithProperty>(
    SEARCH_SQL,
  );
  const countStatement = db.prepare<SearchParams, { total: number }>(COUNT_SQL);
  const propertiesStatement = db.prepare<[], Property>(PROPERTIES_WITH_TASKS_SQL);

  return {
    search(filter: TaskFilter, { page, page_size }: Pagination): TaskSearchResult {
      const params: SearchParams = {
        ...filter,
        statuses: JSON.stringify(filter.statuses),
        categories: JSON.stringify(filter.categories),
        property_ids: JSON.stringify(filter.property_ids),
        q: filter.q === null ? null : escapeLike(filter.q),
      };
      const items = searchStatement.all({ ...params, limit: page_size, offset: (page - 1) * page_size });
      const { total } = countStatement.get(params)!;
      return { items, total, page, page_size };
    },

    filterOptions(): FilterOptions {
      // Sorted in JS: SQLite compares bytes, which puts Å before Æ and Ø (Norwegian order is Æ, Ø, Å).
      const properties = propertiesStatement
        .all()
        .sort((a, b) => a.name.localeCompare(b.name, 'nb'));
      return { statuses: TASK_STATUSES, categories: TASK_CATEGORIES, properties };
    },
  };
}
