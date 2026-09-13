import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { openDatabase } from './db.js';

const newApp = () => createApp(openDatabase(':memory:'));

describe('POST /api/tasks/search', () => {
  it('returns the first page of 50 and the total for an empty body', async () => {
    const res = await request(newApp()).post('/api/tasks/search').send({});

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1000, page: 1, page_size: 50 });
    expect(res.body.items).toHaveLength(50);
  });

  it('returns the requested page', async () => {
    const res = await request(newApp())
      .post('/api/tasks/search')
      .send({ page: 3, page_size: 10 });

    expect(res.body).toMatchObject({ total: 1000, page: 3, page_size: 10 });
    expect(res.body.items).toHaveLength(10);
  });

  it('includes the property name on each task', async () => {
    const res = await request(newApp())
      .post('/api/tasks/search')
      .send({ page_size: 1000 });

    expect(res.body.items.find((t: { id: string }) => t.id === 'task-0001')).toMatchObject({
      property_id: 'prop-004',
      property_name: 'Torvhaugen Næringsbygg',
    });
  });

  it.each([
    ['page 0', { page: 0 }],
    ['a fractional page size', { page_size: 2.5 }],
    ['a page size above 1000', { page_size: 1001 }],
  ])('rejects %s', async (_name, body) => {
    const res = await request(newApp()).post('/api/tasks/search').send(body);

    expect(res.status).toBe(400);
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

  it('searches with the text from the body and treats a blank search as none', async () => {
    const app = newApp();

    const searched = await request(app).post('/api/tasks/search').send({ q: 'Åkerveien' });
    const blank = await request(app).post('/api/tasks/search').send({ q: '   ' });

    expect(searched.status).toBe(200);
    expect(searched.body.total).toBeGreaterThan(0);
    expect(searched.body.total).toBeLessThan(1000);
    expect(blank.body.total).toBe(1000);
  });

  it('rejects searches longer than 200 characters', async () => {
    const res = await request(newApp())
      .post('/api/tasks/search')
      .send({ q: 'a'.repeat(201) });

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
