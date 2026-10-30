# template-bun-mono

A child-free Bun workspace shell. Add applications under `apps/` and reusable packages under `packages/`.

## Structure

```text
apps/
  <app>/
packages/
  <package>/
```

## Getting Started

Create a workspace with components in one step:

```bash
oside create my-mono --template bun-mono --projects bun-vite-react bun-logger
```

The CLI places app templates in `apps/` and package templates in `packages/`. A `template=folder` entry overrides the folder and package name:

```bash
oside create my-mono --template bun-mono --projects bun-hono=api bun-package=shared
```

The workspace shell can also be created without components. Later, run `oside create <name> --template <bun-app-or-package>` from its root to route by template kind, or run it from the exact `apps/` or `packages/` directory to create directly there. App templates belong in `apps/`; package templates belong in `packages/`.

Run `bun install` manually at the workspace root after adding projects. The CLI does not install dependencies or modify root scripts/configuration when adding a component.

## Tooling

- **Bun** — package manager and workspace manager
- **TypeScript** — root defaults are available in `tsconfig.base.json`; generated components use their own local `tsconfig.json`
- **Biome** — root linting and formatting configuration, ready for workspace overrides
- **VS Code** — recommended Biome extension and format-on-save settings
