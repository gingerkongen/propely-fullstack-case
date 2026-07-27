import cors from 'cors';
import express from 'express';
import { openDatabase } from './db.js';
import type { Task } from './types.js';

const PORT = Number(process.env.PORT ?? 8080);

const db = openDatabase();
const selectAllTasks = db.prepare<[], Task>('SELECT * FROM tasks');

const app = express();

app.use(cors());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/tasks', (_req, res) => {
  try {
    res.json(selectAllTasks.all());
  } catch {
    // Fail soft so the table always renders.
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`API listening at http://localhost:${PORT}`);
});
