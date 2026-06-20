import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc, type Socket } from 'socket.io-client';
import request from 'supertest';
import app from './app.js';
import { registerSocketHandlers } from './socket.js';

const TEST_PORT = 3099;

let ioServer: Server;
let clientSocket: Socket;

beforeAll((done) => {
  const httpServer = createServer();
  ioServer = new Server(httpServer);
  registerSocketHandlers(ioServer);
  httpServer.listen(TEST_PORT, () => {
    clientSocket = ioc(`http://localhost:${TEST_PORT}`);
    clientSocket.on('connect', done);
  });
});

afterAll(() => {
  ioServer.close();
  clientSocket.disconnect();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('socket message event', () => {
  it('broadcasts message to all clients', (done) => {
    clientSocket.on('message', (data: unknown) => {
      expect(data).toBe('hello');
      done();
    });
    clientSocket.emit('message', 'hello');
  });
});
