import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { registerSocketHandlers } from './socket.js';

const port = process.env['PORT'] ?? '3001';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

registerSocketHandlers(io);

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
