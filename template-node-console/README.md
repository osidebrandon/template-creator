# template-node-console

A Node.js + TypeScript template for console applications.

## Scripts

| Script           | Description                         |
| ---------------- | ----------------------------------- |
| `yarn dev`       | Start with file watching via `tsx`  |
| `yarn build`     | Compile TypeScript to `dist/`       |
| `yarn start`     | Run the compiled output             |
| `yarn test`      | Run Jest tests                      |
| `yarn typecheck` | Type-check without emitting files   |
| `yarn lint`      | Lint `src/` with ESLint             |
| `yarn lint:fix`  | Auto-fix lint and formatting issues |

## Stack

- **TypeScript** — strict mode
- **ESLint** — flat config (v9) with `typescript-eslint`
- **Prettier** — formatting, integrated with ESLint via `eslint-config-prettier`
- **Jest** + **ts-jest** — unit testing
- **tsx** — fast TypeScript runner for development
- **dotenv** — environment variable loading

## Editor Setup

Install the recommended VS Code extensions when prompted. The workspace is configured to format and lint-fix on save automatically.
