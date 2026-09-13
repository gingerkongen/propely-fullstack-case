import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { openDatabase } from './db.js';

describe('GET /api/tasks', () => {
  it('returns every seeded task', async () => {
    const app = createApp(openDatabase(':memory:'));

    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1000);
  });

  it('includes the property name on each task', async () => {
    const app = createApp(openDatabase(':memory:'));

    const res = await request(app).get('/api/tasks');

    const task = res.body.find((t: { id: string }) => t.id === 'task-0001');
    expect(task).toMatchObject({ property_id: 'prop-004', property_name: 'Torvhaugen Næringsbygg' });
  });

  it('responds 500 instead of an empty list when the database fails', async () => {
    const db = openDatabase(':memory:');
    const app = createApp(db);
    db.close();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
