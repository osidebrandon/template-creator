import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { AddressInfo } from 'node:net';
import { app } from './index';

let server: ReturnType<typeof app.listen> | undefined;
let endpoint: string;

beforeAll(async () => {
  server = app.listen(0);
  if (!server.listening) {
    await new Promise<void>((resolve, reject) => {
      server?.once('listening', resolve);
      server?.once('error', reject);
    });
  }

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Express test server did not start on a TCP port');
  }
  endpoint = `http://localhost:${(address as AddressInfo).port}`;
});

afterAll(
  async () => {
    if (!server?.listening) return;
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
  }
);

describe('GET /', () => {
  it('returns a greeting', async () => {
    const response = await fetch(`${endpoint}/`);
    expect(await response.json()).toEqual({ message: 'Hello from Bun + Express!' });
  });
});
