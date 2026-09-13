import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { openDatabase } from './db.js';
import { fold } from './fold.js';
import { createTaskQueries, type Pagination, type TaskFilter } from './taskQueries.js';
import type { Task } from './types.js';

const seedTasks: Task[] = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'seed', 'tasks.json'), 'utf8'),
);
const queries = createTaskQueries(openDatabase(':memory:'));
const allRows: Pagination = { page: 1, page_size: seedTasks.length };
const search = (filter: TaskFilter, pagination = allRows) => queries.search(filter, pagination);
const noFilter: TaskFilter = {
  statuses: [],
  categories: [],
  property_ids: [],
  created_from: null,
  created_to: null,
  due_from: null,
  due_to: null,
  cost_min: null,
  cost_max: null,
  q: null,
};
const propertyNames = new Map<string, string>(
  JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', '..', 'seed', 'properties.json'), 'utf8')).map(
    (p: { id: string; name: string }) => [p.id, p.name],
  ),
);

/** No bounds matches everything; with a bound, a missing value never matches. */
function inRange<T extends string | number>(value: T | null, from: T | null, to: T | null): boolean {
  if (from === null && to === null) return true;
  return value !== null && (from === null || value >= from) && (to === null || value <= to);
}

/** The same filter in plain JS over the seed file, to check the SQL against. */
function expectedIds(filter: TaskFilter): string[] {
  return seedTasks
    .filter(
      (t) =>
        (filter.statuses.length === 0 || filter.statuses.includes(t.status)) &&
        (filter.categories.length === 0 || filter.categories.includes(t.category)) &&
        (filter.property_ids.length === 0 || filter.property_ids.includes(t.property_id)) &&
        inRange(t.created_at, filter.created_from, filter.created_to) &&
        inRange(t.due_date, filter.due_from, filter.due_to) &&
        inRange(t.cost_nok, filter.cost_min, filter.cost_max) &&
        (filter.q === null ||
          fold(t.title).includes(fold(filter.q)) ||
          fold(propertyNames.get(t.property_id)!).includes(fold(filter.q))),
    )
    .map((t) => t.id)
    .sort();
}

describe('task search', () => {
  it('returns every task when no filter is set', () => {
    expect(search(noFilter).total).toBe(1000);
  });

  it.each<[string, Partial<TaskFilter>]>([
    ['one status', { statuses: ['Rejected'] }],
    ['several statuses (OR within a filter)', { statuses: ['New', 'InProgress'] }],
    ['several categories', { categories: ['Plumbing', 'Electrical'] }],
    ['several properties', { property_ids: ['prop-002', 'prop-011'] }],
    [
      'status, category and property together (AND across filters)',
      { statuses: ['Completed'], categories: ['Outdoor'], property_ids: ['prop-002', 'prop-004'] },
    ],
    ['a created range', { created_from: '2024-01-01', created_to: '2024-12-31' }],
    ['a due date lower bound only', { due_from: '2026-01-01' }],
    ['a cost range', { cost_min: 10000, cost_max: 50000 }],
    ['a cost upper bound only', { cost_max: 1000 }],
    [
      'lists and ranges together',
      { statuses: ['New', 'InProgress'], created_from: '2025-01-01', cost_min: 5000 },
    ],
    ['a search in titles', { q: 'lekkasje' }],
    ['a search in property names', { q: 'bryggekanten' }],
    ['a search with filters', { q: 'sameiet', statuses: ['New'], cost_min: 10000 }],
  ])('matches the seed data for %s', (_name, partial) => {
    const filter = { ...noFilter, ...partial };
    const expected = expectedIds(filter);

    const result = search(filter);

    expect(expected.length).toBeGreaterThan(0);
    expect(result.items.map((t) => t.id).sort()).toEqual(expected);
    expect(result.total).toBe(expected.length);
  });

  it('leaves out tasks without a value once a range is set on that column', () => {
    const withDueDate = seedTasks.filter((t) => t.due_date !== null).length;
    const withCost = seedTasks.filter((t) => t.cost_nok !== null).length;

    expect(search({ ...noFilter, due_from: '1900-01-01' }).total).toBe(withDueDate);
    expect(search({ ...noFilter, cost_min: 0 }).total).toBe(withCost);
  });

  it('includes both ends of a range', () => {
    const day = seedTasks[0].created_at;
    const createdThatDay = seedTasks.filter((t) => t.created_at === day).length;

    expect(search({ ...noFilter, created_from: day, created_to: day }).total).toBe(createdThatDay);
  });

  it('finds the same tasks with and without æøå, in any case', () => {
    const ids = (q: string) => search({ ...noFilter, q }).items.map((t) => t.id);

    const withAccents = ids('Åkerveien');
    expect(withAccents.length).toBeGreaterThan(0);
    expect(ids('akerveien')).toEqual(withAccents);
    expect(ids('ÅKERVEIEN')).toEqual(withAccents);
    expect(ids('blåbær')).toEqual(ids('BLABAER'));
  });

  it('treats LIKE wildcards in the search as plain characters', () => {
    expect(search({ ...noFilter, q: 'lekkasje' }).total).toBeGreaterThan(0);
    expect(search({ ...noFilter, q: 'lekk_sje' }).total).toBe(0);
    expect(search({ ...noFilter, q: '%' }).total).toBe(0);
  });

  it('returns nothing for a property without tasks', () => {
    expect(search({ ...noFilter, property_ids: ['prop-028'] }).total).toBe(0);
  });

  it('sorts newest first and breaks same-day ties by id, so the order is stable', () => {
    const ids = search(noFilter).items.map((t) => t.id);

    const expected = [...seedTasks]
      .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id))
      .map((t) => t.id);
    expect(ids).toEqual(expected);
  });
});

describe('pagination', () => {
  const rejected = { ...noFilter, statuses: ['Rejected' as const] };
  const rejectedCount = () => expectedIds(rejected).length;

  it('returns one page of rows and the total across all pages', () => {
    const result = search(noFilter, { page: 1, page_size: 50 });

    expect(result.items).toHaveLength(50);
    expect(result).toMatchObject({ total: 1000, page: 1, page_size: 50 });
  });

  it('puts every row on exactly one page, in the same order as unpaged', () => {
    const unpaged = search(noFilter).items.map((t) => t.id);
    const pageSize = 37; // doesn't divide 1000, so the last page is partial

    const paged: string[] = [];
    for (let page = 1; page <= Math.ceil(unpaged.length / pageSize); page++) {
      paged.push(...search(noFilter, { page, page_size: pageSize }).items.map((t) => t.id));
    }

    expect(paged).toEqual(unpaged);
  });

  it('pages within the filtered rows', () => {
    const result = search(rejected, { page: 2, page_size: 20 });

    expect(result.items).toHaveLength(rejectedCount() - 20);
    expect(result.items.every((t) => t.status === 'Rejected')).toBe(true);
    expect(result.total).toBe(rejectedCount());
  });

  it('still reports the total for a page past the end', () => {
    const result = search(rejected, { page: 5, page_size: 20 });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(rejectedCount());
  });
});

describe('filter options', () => {
  const options = queries.filterOptions();

  it('offers every status and category', () => {
    expect(options.statuses).toEqual(['New', 'InProgress', 'Completed', 'Rejected']);
    expect(options.categories).toHaveLength(6);
  });

  it('only offers properties that have tasks', () => {
    const ids = options.properties.map((p) => p.id);
    expect(ids).toHaveLength(38);
    expect(ids).not.toContain('prop-028');
    expect(ids).not.toContain('prop-040');
  });

  it('sorts properties in Norwegian order (Ø before Å)', () => {
    const names = options.properties.map((p) => p.name);
    expect(names.indexOf('Ørnehøgda 31')).toBeLessThan(names.indexOf('Åkerveien 3'));
  });
});
