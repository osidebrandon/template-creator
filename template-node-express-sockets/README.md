# template-node-express-sockets

A Node.js + TypeScript template for an Express HTTP server with Socket.IO real-time messaging.

## Requirements

- Node.js >= 25
- Yarn 1.x

## Getting Started

```bash
# Install dependencies
yarn

# Copy environment variables
cp .env.example .env

# Start in development mode (watch)
yarn dev
```

The server listens on `http://localhost:3001` by default. Both Express and Socket.IO share the same HTTP server.

## Scripts

| Script               | Description                         |
| -------------------- | ----------------------------------- |
| `yarn dev`           | Start with file watching via `tsx`  |
| `yarn build`         | Compile TypeScript to `dist/`       |
| `yarn start`         | Run the compiled output             |
| `yarn test`          | Run Jest tests                      |
| `yarn test:watch`    | Run tests in watch mode             |
| `yarn test:coverage` | Run tests with coverage report      |
| `yarn typecheck`     | Type-check without emitting files   |
| `yarn lint`          | Lint `src/` with ESLint             |
| `yarn lint:fix`      | Auto-fix lint and formatting issues |

## Stack

- **Express 5** — HTTP routing with `cors`
- **Socket.IO** — bidirectional real-time messaging
- **TypeScript** — strict mode, ESM output (`NodeNext`)
- **ESLint** — flat config (v9) with `typescript-eslint`
- **Prettier** — formatting, integrated with ESLint via `eslint-config-prettier`
- **Jest** + **ts-jest** + **supertest** + **socket.io-client** — HTTP and socket integration tests

## Project Structure

```
src/
  index.ts        # Wires app + socket.io to one http.Server and starts listening
  app.ts          # Express app and HTTP routes
  socket.ts       # registerSocketHandlers(io) — socket event logic
  index.test.ts   # HTTP + socket integration tests
```

## Endpoints

| Method | Path      | Description             |
| ------ | --------- | ----------------------- |
| `GET`  | `/health` | Returns `{status:"ok"}` |

## Socket Events

| Event     | Direction        | Payload | Description                        |
| --------- | ---------------- | ------- | ---------------------------------- |
| `message` | client → server  | any     | Broadcast to all connected clients |
| `message` | server → clients | any     | Echo of the broadcast              |

Add new events in [src/socket.ts](src/socket.ts).

## Environment Variables

Copy `.env.example` to `.env` and fill in values. The `.env` file is git-ignored.

| Variable   | Default       | Description      |
| ---------- | ------------- | ---------------- |
| `PORT`     | `3001`        | HTTP/socket port |
| `NODE_ENV` | `development` | Node environment |

## Editor Setup

Install the recommended VS Code extensions when prompted. The workspace is configured to format and lint-fix on save automatically.
