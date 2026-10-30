import { describe, expect, it } from 'bun:test';
import { app } from './index';

describe('GET /', () => {
  it('returns a greeting', async () => {
    const response = await app.request('/');
    expect(await response.text()).toBe('Hello from Bun + Hono!');
  });
});
