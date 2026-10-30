# template-bun-mono

A Bun + TypeScript monorepo starter using Bun workspaces.

## Structure

```text
apps/
  bun-console/
    src/
packages/
  logger/
    src/
```

The `@local/logger` workspace package exports `log(namespace, message)`. The example app uses it to print `[EXAMPLE] Hello world!`.

## Getting Started

```bash
bun install
bun run test
bun run typecheck
bun run lint
bun run format
bun run --filter bun-console start
```

Each workspace also has its own scripts. Run them from that workspace directory:

```bash
cd apps/bun-console
bun run start
bun run test
bun run typecheck
bun run lint
bun run format
```

The logger package has `test`, `typecheck`, `lint`, and `format` scripts.

## Tooling

- **Bun** — runtime, package manager, workspace manager, and test runner
- **TypeScript** — shared strict compiler defaults with per-workspace `tsconfig.json` files
- **Biome** — shared linting and formatting rules, with workspace configs ready for future overrides
- **VS Code** — recommended Biome extension and format-on-save settings
