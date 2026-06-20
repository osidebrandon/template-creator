# template-node-package

A Node.js + TypeScript template for library packages.

## Requirements

- Node.js >= 25
- Yarn 1.x

## Getting Started

```bash
# Install dependencies
yarn
```

## Scripts

| Script               | Description                         |
| -------------------- | ----------------------------------- |
| `yarn build`         | Compile TypeScript to `dist/`       |
| `yarn test`          | Run Jest tests                      |
| `yarn test:watch`    | Run tests in watch mode             |
| `yarn test:coverage` | Run tests with coverage report      |
| `yarn typecheck`     | Type-check without emitting files   |
| `yarn lint`          | Lint `src/` with ESLint             |
| `yarn lint:fix`      | Auto-fix lint and formatting issues |

`prepublishOnly` runs `yarn build` automatically before publishing.

## Stack

- **TypeScript** — strict mode, ESM output (`NodeNext`)
- **ESLint** — flat config (v9) with `typescript-eslint`
- **Prettier** — formatting, integrated with ESLint via `eslint-config-prettier`
- **Jest** + **ts-jest** — unit testing with native ESM support

## Project Structure

```
src/
  index.ts         # Package entry point — export your public API here
  index.test.ts    # Tests co-located with source
dist/              # Compiled output (git-ignored, published to npm)
```

## Using This Package

### Local development with yarn link

```bash
# In this package's directory
yarn build
yarn link

# In the consuming project
yarn link template-node-package
```

Then import using the package name:

```ts
import { greet } from 'template-node-package';
```

> **Note:** `yarn install` in the consuming project will clear the symlink. Re-run `yarn link "template-node-package"` afterwards to restore it.

## Contributing

1. Make your changes in `src/`
2. Run `yarn test` and `yarn typecheck` to verify
3. Run `yarn build` to compile
4. Re-link in any consuming projects:

   ```bash
   # In this package
   yarn build

   # In the consuming project (after each build)
   yarn link "template-node-package"
   ```

## Notes

- All imports in source files must use the `.js` extension (e.g. `'./utils.js'`), even when importing `.ts` files. This is required for Node.js ESM.
- There is no `dev` or `start` script — this is a library, not a runnable application.
