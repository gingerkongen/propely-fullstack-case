import type Database from 'better-sqlite3';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import type { Task } from './types.js';

export function createApp(db: Database.Database) {
  const selectAllTasks = db.prepare<[], Task>('SELECT * FROM tasks');

  const app = express();

  app.use(cors());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/tasks', (_req, res) => {
    res.json(selectAllTasks.all());
  });

  // Express 5 forwards errors thrown in route handlers (sync or async) to this handler.
  const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  };
  app.use(handleError);

  return app;
}
