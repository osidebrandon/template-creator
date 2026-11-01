# event-bus

`event-bus` is a small, synchronous event bus for typed TypeScript events. It has no runtime dependencies and can be generated as a standalone package or added to a Bun workspace.

## Add the package

From an existing Bun workspace root, create the package with:

```bash
oside create --template bun-event-bus
```

The creator defaults the project and package name to `event-bus` and places it in `packages/event-bus`. To rename it, pass a project name; that name becomes both the folder and `package.json` name:

```bash
oside create custom-event-bus --template bun-event-bus
```

To create a new workspace with both `ac-state` and its event bus package:

```bash
oside create my-workspace --template bun-mono --projects bun-ac-state bun-event-bus
```

The creator does not add dependency packages automatically. If you generate `ac-state`, add `event-bus` separately before running `bun install`; both packages should be part of the same workspace. Outside a workspace, `event-bus` is generated as a standalone project.

## Use it

Declare your event names and payloads, then subscribe, publish, and unsubscribe:

```ts
import { EventBus } from "event-bus";

type AppEvents = {
  "player:joined": { playerId: string };
  "score:changed": { playerId: string; score: number };
};

const events = new EventBus<AppEvents>();

const onPlayerJoined = (event: AppEvents["player:joined"]) => {
  console.log(`${event.playerId} joined`);
};

events.on("player:joined", onPlayerJoined);
events.publish("player:joined", { playerId: "player-0" });
events.off("player:joined", onPlayerJoined);
```

The event name determines the listener and payload types, so unknown names or mismatched payloads are caught by TypeScript.

## API and behavior

- `on(eventName, listener)` registers a listener.
- `off(eventName, listener)` removes that listener; pass the same function reference used with `on`.
- `publish(eventName, payload)` synchronously calls the listeners registered for that event.

Each publish uses a snapshot of its listeners. Changes made to subscriptions during a callback take effect on later publishes. Listener exceptions are not swallowed and will propagate from `publish`.

## Develop

Run these commands from the generated package directory:

```bash
bun install
bun test
bun run typecheck
bun run build
```
