# @oside/creator

A small CLI (`oside`) that scaffolds new projects from the local templates in this workspace.

## Requirements

- Node.js >= 25
- Yarn 1.x (for the templates) — `npm` for installing the CLI globally

## Install (Local)

```bash
cd ./creator
yarn install
yarn build
npm link        # registers the `oside` bin globally
```

> Use `npm link` rather than `yarn link` — Yarn 1.x does not register `bin` entries globally.

To uninstall later: `npm unlink -g @oside/creator`.

## Usage

```bash
oside create <projectName> [--template <alias>] [--dir <path>]
oside list
```

### Examples

```bash
oside create my-app                     # uses the default (console) template
oside create my-bun-app -t bun-console
oside create my-api -t express
oside create my-realtime-app -t sockets
oside create my-lib -t package -d ~/dev
oside create my-pixi-app -t pixi-react
oside list                              # show available template aliases
```

After creating, follow the printed next steps (typically `cd <name> && yarn install`).

## Template Aliases

| Alias          | Source directory                |
| -------------- | ------------------------------- |
| `console`      | `template-node-console`         |
| `bun-console`  | `template-bun-console`          |
| `package`      | `template-node-package`         |
| `express`      | `template-node-express`         |
| `sockets`      | `template-node-express-sockets` |
| `pixi-react`   | `template-react-pixi`           |
| `pixi-vanilla` | `template-vanilla-pixi`         |

The mapping lives in [src/templates.ts](src/templates.ts).

## How It Works

1. Resolves the template directory from the alias map.
2. Recursively copies the template into the destination, skipping `node_modules`, `dist`, `coverage`, `.yarn`, `yarn.lock`, `yarn-error.log`, and `.env`.
3. Updates `package.json` in the new project — sets `name` to `<projectName>` and resets `version` to `0.0.1`.

The CLI locates templates relative to its own install location (`creator/` must live next to the `template-*/` directories).

## Adding a New Template

1. Create a new directory in the workspace root, e.g. `template-node-foo/`.
2. Add an entry to [src/templates.ts](src/templates.ts):

   ```ts
   export const TEMPLATE_MAP: Record<string, string> = {
     // ...existing entries
     foo: "template-node-foo",
   };
   ```

3. Update the test in [src/templates.test.ts](src/templates.test.ts) to include the new alias.
4. Rebuild:

   ```bash
   yarn build
   ```

   No need to re-link — `npm link` uses a symlink so the new build is picked up automatically.

The `bun-console` template uses Bun for installation, running, and tests; run `bun install` in the generated project.

## Scripts

| Script           | Description                               |
| ---------------- | ----------------------------------------- |
| `yarn dev`       | Run the CLI with watch mode via `tsx`     |
| `yarn build`     | Compile TypeScript and `chmod +x` the bin |
| `yarn start`     | Run the compiled CLI                      |
| `yarn test`      | Run Jest tests                            |
| `yarn typecheck` | Type-check without emitting               |
| `yarn lint`      | Lint `src/` with ESLint                   |
| `yarn lint:fix`  | Auto-fix lint and formatting issues       |

## Stack

- **commander** — argument & flag parsing
- **fs-extra** — recursive directory copy with promises
- **TypeScript / ESLint / Prettier / Jest** — same tooling as the templates
