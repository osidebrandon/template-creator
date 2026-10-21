# template-bun-console

A Bun + TypeScript console application template.

## Getting Started

```bash
bun install
bun run dev
```

Pass an optional name to the application:

```bash
bun run start Alice
```

## Scripts

| Script           | Description                       |
| ---------------- | --------------------------------- |
| `bun run dev`    | Run with Bun's file watcher       |
| `bun run start`  | Run the TypeScript application   |
| `bun run build`  | Build to `dist/`                  |
| `bun test`       | Run tests with Bun                |
| `bun run lint`   | Lint `src/` with ESLint           |
| `bun run typecheck` | Type-check with TypeScript     |

## Stack

- **Bun** — runtime, package manager, and test runner
- **TypeScript** — strict type checking
- **ESLint** with `typescript-eslint` — linting
