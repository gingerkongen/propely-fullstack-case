/**
 * SQLite setup.
 *
 * The database file is gitignored. On startup, if it does not exist or its schema is
 * outdated, it is (re)built from the committed seed/tasks.json, which is the single
 * source of truth for the dataset. Data is never generated at runtime.
 */

import Database from 'better-sqlite3';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fold } from './fold.js';
import {
  TASK_CATEGORIES,
  TASK_STATUSES,
  type Property,
  type Task,
} from './types.js';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..');
export const DB_PATH = process.env.DB_PATH ?? join(REPO_ROOT, 'apps', 'api', 'tasks.db');
const TASKS_SEED_PATH = join(REPO_ROOT, 'seed', 'tasks.json');
const PROPERTIES_SEED_PATH = join(REPO_ROOT, 'seed', 'properties.json');

const sqlList = (values: readonly string[]): string =>
  values.map((value) => `'${value}'`).join(', ');

/** Bump when CREATE_TABLES_SQL changes, so existing databases get rebuilt from the seed. */
const SCHEMA_VERSION = 1;

// The *_search columns hold fold()ed copies for accent-insensitive search (see fold.ts).
// STORED: computed once on insert instead of on every query.
const CREATE_TABLES_SQL = `
  CREATE TABLE properties (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    name_search TEXT GENERATED ALWAYS AS (fold(name)) STORED
  );

  CREATE TABLE tasks (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    category      TEXT NOT NULL CHECK (category IN (${sqlList(TASK_CATEGORIES)})),
    status        TEXT NOT NULL CHECK (status IN (${sqlList(TASK_STATUSES)})),
    property_id   TEXT NOT NULL REFERENCES properties(id),
    created_at    TEXT NOT NULL,
    due_date      TEXT,
    cost_nok      INTEGER,
    title_search  TEXT GENERATED ALWAYS AS (fold(title)) STORED
  );
`;

const INSERT_PROPERTY_SQL = `
  INSERT INTO properties (id, name) VALUES (@id, @name);
`;

const INSERT_TASK_SQL = `
  INSERT INTO tasks (
    id, title, description, category, status,
    property_id, created_at, due_date, cost_nok
  ) VALUES (
    @id, @title, @description, @category, @status,
    @property_id, @created_at, @due_date, @cost_nok
  );
`;

function buildFromSeed(db: Database.Database): void {
  for (const path of [TASKS_SEED_PATH, PROPERTIES_SEED_PATH]) {
    if (!existsSync(path)) {
      throw new Error(`Seed file not found at ${path}`);
    }
  }

  const properties = JSON.parse(readFileSync(PROPERTIES_SEED_PATH, 'utf8')) as Property[];
  const tasks = JSON.parse(readFileSync(TASKS_SEED_PATH, 'utf8')) as Task[];

  // An outdated database is rebuilt from scratch; the seed is the source of truth.
  db.exec('DROP TABLE IF EXISTS tasks; DROP TABLE IF EXISTS properties;');
  db.exec(CREATE_TABLES_SQL);

  const insertProperty = db.prepare(INSERT_PROPERTY_SQL);
  const insertTask = db.prepare(INSERT_TASK_SQL);

  const insertAll = db.transaction(() => {
    for (const property of properties) insertProperty.run(property);
    for (const task of tasks) insertTask.run(task);
  });
  insertAll();
  db.pragma(`user_version = ${SCHEMA_VERSION}`);

  console.log(
    `Built ${db.name} from seed (${properties.length} properties, ${tasks.length} tasks).`,
  );
}

/** Opens (and seeds, if new or outdated) the database. Tests pass ':memory:' for a fresh copy. */
export function openDatabase(path: string = DB_PATH): Database.Database {
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  // Needed on every connection: inserts compute the generated *_search columns with it.
  db.function('fold', { deterministic: true }, fold);

  // A new file (or ':memory:') has user_version 0, so this also covers the first start.
  if (db.pragma('user_version', { simple: true }) !== SCHEMA_VERSION) {
    buildFromSeed(db);
  }

  return db;
}
