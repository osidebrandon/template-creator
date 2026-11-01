# @oside/creator

A small CLI (`oside`) that scaffolds projects from the local templates in this workspace.

## Requirements

- Node.js >= 25
- Yarn 1.x for legacy templates
- Bun for Bun templates

## Install (Local)

```bash
cd ./creator
yarn install
yarn build
npm link
```

> Use `npm link` rather than `yarn link` — Yarn 1.x does not register `bin` entries globally.

To uninstall later: `npm unlink -g @oside/creator`.

## Usage

```bash
oside create [projectName] --template <alias>
oside create <workspaceName> --template bun-mono --projects <template[=folder]...>
oside list
```

`--template` is required for every `create`. Package templates default to the name in their `package.json`; pass `projectName` to choose another folder and package name. App, workspace, and legacy templates still require `projectName`. Projects are created relative to the current working directory.

### Examples

```bash
oside create my-app --template bun-console
oside create my-api -t bun-hono
oside create my-library -t bun-package
oside create --template bun-event-bus
oside create my-event-bus --template bun-event-bus
oside create my-workspace -t bun-mono --projects bun-vite-react bun-logger
oside create my-workspace -t bun-mono --projects bun-hono=api bun-package=shared
oside create my-node-api -t express
oside list
```

`--projects` is only available when creating a new `bun-mono` workspace. Each item is a Bun app or package alias, optionally followed by `=folder`. Without an override, app folders use the alias and package folders use the template package name. A folder override also becomes the component's `package.json` name.

## Workspace routing

Outside a Bun workspace, every template creates a standalone project at `CWD/<projectName>`. The `bun-mono` template creates a workspace root; when `--projects` is provided, Bun app templates are placed in `apps/<name>` and Bun package templates in `packages/<name>`.

For later additions, the CLI recognizes a workspace by finding an ancestor `package.json` that declares both `apps/*` and `packages/*` in `workspaces`. From that workspace root, Bun apps and packages are routed by template kind. From the exact `apps/` or `packages/` directory, creation goes directly under the current directory and the template kind must match. Deeper workspace child directories are rejected.

Only Bun app and package templates can be added to a Bun workspace. Legacy templates are standalone-only in this workspace flow, and `bun-mono` creates roots only. New Bun components have local TypeScript configuration and do not depend on the workspace root's `tsconfig.base.json`.

Project names and folder overrides must be safe single path segments.

## Templates

`oside list` groups these by Bun kind and lists non-Bun aliases under **Legacy**.

| Kind | Alias | Source directory |
| --- | --- | --- |
| Bun app | `bun-console` | `template-bun-console` |
| Bun app | `bun-hono` | `template-bun-hono` |
| Bun app | `bun-express` | `template-bun-express` |
| Bun app | `bun-vite-vanilla` | `template-bun-vite-vanilla` |
| Bun app | `bun-vite-react` | `template-bun-vite-react` |
| Bun package | `bun-ac-state` | `template-bun-ac-state` |
| Bun package | `bun-logger` | `template-bun-logger` |
| Bun package | `bun-package` | `template-bun-package` |
| Bun package | `bun-event-bus` | `template-bun-event-bus` |
| Bun package | `bun-lifecycles` | `template-bun-lifecycles` |
| Bun workspace | `bun-mono` | `template-bun-mono` |
| Legacy | `console` | `template-node-console` |
| Legacy | `package` | `template-node-package` |
| Legacy | `express` | `template-node-express` |
| Legacy | `sockets` | `template-node-express-sockets` |
| Legacy | `pixi-react` | `template-react-pixi` |
| Legacy | `pixi-vanilla` | `template-vanilla-pixi` |

The Bun package templates are minimal reusable TypeScript libraries. `bun-package` has no runtime dependencies; `bun-logger` preserves the logger sample formerly included in the workspace shell. `lifecycles` provides process lifecycle hooks with no runtime dependencies. The `ac-state` and `event-bus` packages are available through the `bun-ac-state` and `bun-event-bus` templates. They remain separate packages; `ac-state` declares `event-bus` as a workspace dependency, but the consumer must create and wire the `event-bus` package separately. Standalone `ac-state` output requires the consumer to resolve or replace its `workspace:*` dependency.

## Installation

The CLI never installs dependencies automatically. For a standalone Bun project, run `bun install` in the generated project. For a workspace create or component addition, run `bun install` at the workspace root. Standalone legacy templates use `yarn install`.

The CLI copies templates while skipping `node_modules`, `dist`, `coverage`, `.yarn`, lockfiles, `yarn-error.log`, and `.env`. It updates a copied `package.json` name to the destination folder name and resets its version to `0.0.1`.

Templates are resolved relative to the CLI installation (`creator/` must live next to the `template-*/` directories).

## Adding a Template

1. Add a directory at the workspace root, such as `template-bun-foo/`.
2. Register the alias in [creator/src/templates.ts](creator/src/templates.ts). Bun templates also declare a `kind` of `app`, `package`, or `workspace`; legacy templates omit kind metadata.
3. Add focused tests in `creator/src/`.
4. Build and test the CLI:

   ```bash
   cd creator
   yarn build
   yarn test --runInBand
   ```

## CLI Scripts

| Script | Description |
| --- | --- |
| `yarn dev` | Run the CLI in watch mode via `tsx` |
| `yarn build` | Compile TypeScript |
| `yarn start` | Run the compiled CLI |
| `yarn test` | Run Jest tests |
| `yarn typecheck` | Type-check without emitting |
| `yarn lint` | Lint `src/` with ESLint |
| `yarn lint:fix` | Auto-fix lint issues |

## Stack

- **commander** — command-line parsing
- **fs-extra** — recursive template copying
- **TypeScript / ESLint / Prettier / Jest** — CLI implementation and tests
