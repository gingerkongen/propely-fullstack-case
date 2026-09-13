import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase } from './db.js';

describe('openDatabase', () => {
  let dir: string | undefined;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('stores folded copies of titles and property names for search', () => {
    const db = openDatabase(':memory:');

    const property = db.prepare("SELECT name_search FROM properties WHERE id = 'prop-011'").get();
    const task = db.prepare("SELECT title_search FROM tasks WHERE title_search LIKE '%lekkasje%'").get();

    expect(property).toEqual({ name_search: 'akerveien 3' });
    expect(task).toBeDefined();
  });

  it('rebuilds a database created with an older schema', () => {
    dir = mkdtempSync(join(tmpdir(), 'tasks-db-'));
    const path = join(dir, 'tasks.db');
    const old = new Database(path);
    old.exec('CREATE TABLE properties (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
    old.close();

    const db = openDatabase(path);

    const columns = db.prepare('SELECT name FROM pragma_table_xinfo(?)').all('properties');
    expect(columns).toContainEqual({ name: 'name_search' });
    expect(db.prepare('SELECT count(*) AS n FROM tasks').get()).toEqual({ n: 1000 });
    db.close();
  });
});
