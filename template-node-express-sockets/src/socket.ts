import type { Server } from 'socket.io';

export const registerSocketHandlers = (io: Server): void => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('message', (data: unknown) => {
      io.emit('message', data);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
