import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { openDatabase } from './db.js';

const newApp = () => createApp(openDatabase(':memory:'));

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

describe('POST /api/tasks/search', () => {
  it('returns every task, with its property name, for an empty filter', async () => {
    const res = await request(newApp()).post('/api/tasks/search').send({});

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1000);
    expect(res.body.items).toHaveLength(1000);
    expect(res.body.items.find((t: { id: string }) => t.id === 'task-0001')).toMatchObject({
      property_id: 'prop-004',
      property_name: 'Torvhaugen Næringsbygg',
    });
  });

  it('applies the filter from the body', async () => {
    const res = await request(newApp())
      .post('/api/tasks/search')
      .send({ statuses: ['Rejected'] });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(30);
  });

  it('rejects unknown filter values', async () => {
    const res = await request(newApp())
      .post('/api/tasks/search')
      .send({ statuses: ['Done'] });

    expect(res.status).toBe(400);
  });

  it('rejects dates that are not ISO (YYYY-MM-DD)', async () => {
    const res = await request(newApp())
      .post('/api/tasks/search')
      .send({ created_from: '13.09.2026' });

    expect(res.status).toBe(400);
  });

  it('rejects negative costs', async () => {
    const res = await request(newApp())
      .post('/api/tasks/search')
      .send({ cost_min: -1 });

    expect(res.status).toBe(400);
  });

  it('rejects unknown keys, so a typo does not silently skip a filter', async () => {
    const res = await request(newApp())
      .post('/api/tasks/search')
      .send({ status: ['New'] });

    expect(res.status).toBe(400);
  });

  it('responds 400 to malformed JSON', async () => {
    const res = await request(newApp())
      .post('/api/tasks/search')
      .set('Content-Type', 'application/json')
      .send('{"statuses": [');

    expect(res.status).toBe(400);
  });

  it('responds 500 instead of an empty list when the database fails', async () => {
    const db = openDatabase(':memory:');
    const app = createApp(db);
    db.close();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).post('/api/tasks/search').send({});

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('GET /api/tasks/filter-options', () => {
  it('returns statuses, categories and properties', async () => {
    const res = await request(newApp()).get('/api/tasks/filter-options');

    expect(res.status).toBe(200);
    expect(res.body.statuses).toHaveLength(4);
    expect(res.body.categories).toHaveLength(6);
    expect(res.body.properties[0]).toEqual({ id: expect.any(String), name: expect.any(String) });
  });
});
