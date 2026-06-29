import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { redis } from '../config/redis.js';

describe('Health Check API', () => {
  afterAll(async () => {
    // Clean up connections after tests
    await redis.quit();
  });

  it('should return 200 OK for /health', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message', 'API is running');
  });
});
