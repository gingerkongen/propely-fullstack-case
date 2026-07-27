/**
 * SQLite setup.
 *
 * The database file is gitignored. On startup, if it does not exist, it is built
 * from the committed seed/tasks.json, which is the single source of truth for the
 * dataset. Data is never generated at runtime.
 */

import Database from 'better-sqlite3';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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

const CREATE_TABLES_SQL = `
  CREATE TABLE properties (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL
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
    cost_nok      INTEGER
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

  db.exec(CREATE_TABLES_SQL);

  const insertProperty = db.prepare(INSERT_PROPERTY_SQL);
  const insertTask = db.prepare(INSERT_TASK_SQL);

  const insertAll = db.transaction(() => {
    for (const property of properties) insertProperty.run(property);
    for (const task of tasks) insertTask.run(task);
  });
  insertAll();

  console.log(
    `Built ${DB_PATH} from seed (${properties.length} properties, ${tasks.length} tasks).`,
  );
}

export function openDatabase(): Database.Database {
  const needsSeed = !existsSync(DB_PATH);
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  if (needsSeed) {
    buildFromSeed(db);
  }

  return db;
}
