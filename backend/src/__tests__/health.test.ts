import request from 'supertest';
import app from '../index';

describe('API Health Check', () => {
  it('should return 200 OK for the root endpoint', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Task Manager API is running!');
  });

  it('should return 200 OK and healthy status for /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('message', 'Task Manager API is healthy');
  });
});
