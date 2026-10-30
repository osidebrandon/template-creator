import { Hono } from 'hono';

export const app = new Hono();

app.get('/', (context) => context.text('Hello from Bun + Hono!'));

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
