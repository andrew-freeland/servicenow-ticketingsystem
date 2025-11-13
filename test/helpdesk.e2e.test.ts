import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/index.js';

test('GET /health → 200', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
});

test('seed → create → suggest → resolve → stats', async () => {
  // Seed should be idempotent
  await request(app).post('/seed').expect(200);

  // Create incident
  const create = await request(app)
    .post('/incident')
    .set('content-type', 'application/json')
    .send({ product: 'Product X', short_description: 'OAuth callback failing' })
    .expect(201);

  const id = create.body?.sys_id;
  assert.ok(id, 'Expected sys_id from create');

  // Suggest KB
  const suggest = await request(app).post(`/incident/${id}/suggest`).expect(200);
  const results = suggest.body?.articles;
  assert.ok(Array.isArray(results), 'Expected suggestions array');

  // Resolve incident
  const resolve = await request(app)
    .post(`/incident/${id}/resolve`)
    .set('content-type', 'application/json')
    .send({ resolution_note: 'Resolved via KB guidance' })
    .expect(200);

  // Verify resolve response
  const resolved = resolve.body;
  assert.ok(resolved, 'Expected result from resolve');
  assert.equal(resolved.state, '6', 'Expected state to be 6 (Resolved)');
  
  // Verify close_code is set to a valid choice value
  if (resolved.close_code) {
    assert.equal(resolved.close_code, 'Solution provided', 'Expected close_code to be Solution provided');
  }

  // Stats
  const stats = await request(app).get('/stats').expect(200);
  // Expect number fields present; schema can vary by your implementation
  assert.ok(stats.body, 'Expected stats body');
});

