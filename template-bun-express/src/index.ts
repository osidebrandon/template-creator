import express from 'express';

export const app = express();

app.get('/', (_request, response) => {
  response.json({ message: 'Hello from Bun + Express!' });
});

if (import.meta.main) {
  const port = Number(Bun.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}
