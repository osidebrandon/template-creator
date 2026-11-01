# lifecycles

`lifecycles` provides small synchronous hooks for starting and stopping a process. It has no runtime dependencies.

## Add the package

From an existing Bun workspace root, create the package with:

```bash
oside create --template bun-lifecycles
```

The project and package default to `lifecycles`, and the creator places it in `packages/lifecycles`. To choose another package name:

```bash
oside create my-lifecycles --template bun-lifecycles
```

To include it in a new Bun workspace:

```bash
oside create my-workspace --template bun-mono --projects bun-lifecycles
```

## Use it

`lifecycle` calls `onStart` immediately, then calls `onStop` once when the process exits, receives a supported termination signal, or the returned stop function is called.

```ts
import { lifecycle } from "lifecycles";

const stop = lifecycle({
  onStart: () => {
    console.log("Service started");
  },
  onStop: () => {
    console.log("Service stopping");
  },
});

// Call manually when the service should stop before process exit.
stop();
```

The returned function is safe to call more than once. The package removes its process listeners before calling `onStop`. It does not force the process to exit or await asynchronous cleanup; manage those behaviors in your application.

## API

- `LifecycleOptions` requires `onStart` and `onStop` callbacks.
- `lifecycle(options)` registers the process hooks and returns the idempotent stop function.

## Develop

Run these commands from the generated package directory:

```bash
bun install
bun test
bun run typecheck
bun run build
```
