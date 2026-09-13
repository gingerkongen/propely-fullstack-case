import type Database from 'better-sqlite3';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { z } from 'zod';
import { createTaskQueries } from './taskQueries.js';
import { TASK_CATEGORIES, TASK_STATUSES } from './types.js';

const isoDate = z.iso.date().nullable().default(null);
const kroner = z.number().int().nonnegative().nullable().default(null);

// Strict: an unknown key (e.g. "status" for "statuses") is a 400, not a silently ignored filter.
const taskFilterSchema = z.strictObject({
  statuses: z.array(z.enum(TASK_STATUSES)).default([]),
  categories: z.array(z.enum(TASK_CATEGORIES)).default([]),
  property_ids: z.array(z.string()).default([]),
  created_from: isoDate,
  created_to: isoDate,
  due_from: isoDate,
  due_to: isoDate,
  cost_min: kroner,
  cost_max: kroner,
  // Blank input means no search.
  q: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .default(null)
    .transform((q) => q || null),
});

export function createApp(db: Database.Database) {
  const taskQueries = createTaskQueries(db);

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/tasks/filter-options', (_req, res) => {
    res.json(taskQueries.filterOptions());
  });

  // POST because the body is a structured filter spec (a list per column); nothing is created.
  app.post('/api/tasks/search', (req, res) => {
    const parsed = taskFilterSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid filter', issues: parsed.error.issues });
      return;
    }
    res.json(taskQueries.search(parsed.data));
  });

  // Express 5 forwards errors thrown in route handlers (sync or async) to this handler.
  const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
    // express.json() marks client errors, such as malformed JSON, with a 4xx status.
    if (err.status >= 400 && err.status < 500) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  };
  app.use(handleError);

  return app;
}
