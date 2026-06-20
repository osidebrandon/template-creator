import express, { json, type Request, type Response } from 'express';
import cors from 'cors';

const app = express();
app.use(json());
app.use(cors({ origin: '*' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default app;
