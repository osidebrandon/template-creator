# ac-state

This is a consumer-facing API reference for the v2 actor-components implementation. Each snippet shows one code line followed by its explanation; the snippets are independent and are not a complete application.

## Setup

```ts
import { createAC, createTemplateWrapper } from "ac-state";
```

Imports the framework factory and the optional template wrapper.

```ts
import type {
  AC,
  Actor,
  ActorEvent,
  ActorEventPayload,
  ActorSnapshot,
  Component,
  ComponentEvent,
  ComponentEventPayload,
  ComponentSnapshot,
  ComponentsBase,
  FrameworkEvents,
  State,
  StateSnapshot,
  TemplateDefinitionMap,
  TemplateSpawnOptions,
} from "ac-state";
```

Imports types used by the examples. These imports are erased from the generated JavaScript.

```ts
type Components = {
  name: { name: string };
  health: { current: number; max: number };
  mood: { value: string };
};
```

Defines the component names and the data each component stores. The keys become the valid component types for the framework instance.

```ts
type Metadata = { type: "player" | "npc"; faction: string };
```

Defines project-owned actor metadata. The framework does not prescribe metadata fields.

```ts
const ac = createAC<Components>();
```

Creates a framework instance without actor metadata. Actors and snapshots from this instance do not expose `metadata` or `setMetadata`.

```ts
const metadataAC = createAC<Components, Metadata>();
```

Creates a metadata-enabled framework instance. Its actor snapshots require metadata, and factory-created actors expose it.

`Actor` and `Component` are type-only exports; consumers obtain instances through the framework and its actor/component methods.

## Snapshots and initialization

```ts
const plainActorSnapshot = ac.createActorSnapshot("actor-1", [
  { type: "name", name: "Ada" },
]);
```

Creates a snapshot for a metadata-free actor. The component array is keyed by each component's `type`.

```ts
const playerSnapshot = metadataAC.createActorSnapshot(
  "player-1",
  [{ type: "name", name: "Ada" }],
  { type: "player", faction: "blue" },
);
```

Creates a snapshot for an actor whose metadata is required by the `metadataAC` type parameter.

```ts
const initialState = metadataAC.createStateSnapshot([playerSnapshot]);
```

Builds a state snapshot from actor snapshots and rejects duplicate actor IDs.

```ts
metadataAC.initialize(initialState);
```

Replaces the framework's current actor state with the supplied snapshot.

```ts
const spawnedActor = metadataAC.spawnActor(
  metadataAC.createActorSnapshot(
    "player-2",
    [{ type: "health", current: 100, max: 100 }],
    { type: "player", faction: "red" },
  ),
);
```

Creates and registers an actor from a snapshot. Duplicate actor IDs are rejected.

```ts
const savedActor = spawnedActor.snapshot();
```

Creates a detached actor snapshot, including metadata when metadata is enabled.

## Actor queries and lifecycle

```ts
const foundActor = metadataAC.getActor("player-2");
```

Looks up one actor by ID. The result is `undefined` if no actor has that ID.

```ts
const players = metadataAC.queryActors(
  (actor) => actor.metadata.type === "player",
);
```

Returns actors matching a predicate. The predicate receives the typed actor, including consumer metadata when configured.

```ts
const healthComponents = metadataAC.queryComponents(
  (component, actor) =>
    actor.metadata.type === "player" && component.snapshot().type === "health",
);
```

Returns components matching a predicate. The predicate receives both the component and the actor that owns it.

```ts
metadataAC.destroyActor("player-2");
```

Removes an actor by ID and publishes `actor:destroyed` when the actor exists.

## Actor component operations

```ts
const healthComponent = spawnedActor.getComponent("health");
```

Gets an actor's component by type. The result is `undefined` if the actor does not have that component.

```ts
const actorHealthComponents = spawnedActor.queryComponents(
  (component) => component.snapshot().type === "health",
);
```

Queries only the components attached to one actor.

```ts
const moodComponent = spawnedActor.addComponent({
  type: "mood",
  value: "focused",
});
```

Adds a component and publishes `component:added`. Adding a second component of the same type throws.

```ts
const actorSnapshot = spawnedActor.snapshot();
```

Captures the actor's current ID, components, and configured metadata.

```ts
spawnedActor.removeComponent("mood");
```

Removes a component by type and publishes `component:removed` when it exists.

## Component operations

```ts
const componentSnapshot = healthComponent?.snapshot();
```

Gets a detached snapshot of a component, including its `type` discriminator.

```ts
const currentHealth = healthComponent?.getValue();
```

Reads the component's current value.

```ts
healthComponent?.setValue({ current: 80, max: 100 });
```

Replaces the component's whole value and publishes `component:changed`.

```ts
healthComponent?.remove();
```

Removes the component from its owning actor. This has the same effect as `actor.removeComponent(type)`.

## Metadata

```ts
const actorType = spawnedActor.metadata.type;
```

Reads consumer-owned metadata from a metadata-enabled actor. Metadata is not present on actors created without a metadata type parameter.

```ts
spawnedActor.setMetadata({ type: "npc", faction: "green" });
```

Replaces the entire metadata object and publishes `actor:changed` with the updated actor snapshot. Component mutations continue to use component events.

## Events

```ts
const onActorEvent = metadataAC.createEventHandler<ActorEvent>(({ actor }) =>
  console.log(actor.id),
);
```

Creates a typed handler for `actor:spawned`, `actor:changed`, and `actor:destroyed` payloads.

```ts
const onComponentEvent = metadataAC.createEventHandler<ComponentEvent>(
  ({ component }) => console.log(component.type),
);
```

Creates a typed handler for component lifecycle and change events.

```ts
metadataAC.on("actor:spawned", onActorEvent);
```

Subscribes to actor creation events.

```ts
metadataAC.on("actor:changed", onActorEvent);
```

Subscribes to metadata replacement events. Component changes do not publish this event.

```ts
metadataAC.on("actor:destroyed", onActorEvent);
```

Subscribes to actor removal events.

```ts
metadataAC.on("component:added", onComponentEvent);
```

Subscribes to component addition events.

```ts
metadataAC.on("component:changed", onComponentEvent);
```

Subscribes to component value replacement events.

```ts
metadataAC.on("component:removed", onComponentEvent);
```

Subscribes to component removal events.

```ts
metadataAC.off("actor:spawned", onActorEvent);
```

Removes a previously registered handler. Use the same `off` operation with the other event names to remove their handlers.

## Templates

```ts
const playerDefaults: ComponentSnapshot<Components>[] = [
  { type: "name", name: "Template player" },
  { type: "health", current: 100, max: 100 },
];
```

Defines the default component snapshots for one template.

```ts
const npcDefaults: ComponentSnapshot<Components>[] = [
  { type: "name", name: "Template NPC" },
];
```

Defines another template's default components.

```ts
const templates = {
  player: playerDefaults,
  npc: npcDefaults,
} satisfies TemplateDefinitionMap<Components>;
```

Maps literal template names to component snapshots. The names become the valid template arguments at compile time.

```ts
const templateActors = createTemplateWrapper(metadataAC, templates);
```

Creates a wrapper around an existing metadata-enabled framework. The consumer's metadata type must include a string-compatible `type` field.

```ts
const templatedPlayer = templateActors.spawnFromTemplate("player", {
  id: "player-3",
  metadata: { type: "npc", faction: "blue" },
  componentOverrides: [{ type: "health", current: 50, max: 100 }],
});
```

Spawns from the named template. The wrapper overwrites `metadata.type` with `"player"`; component overrides replace template defaults of the same type, and new component types are added.

```ts
const templatedPlayers = metadataAC.queryActors(
  (actor) => actor.metadata.type === "player",
);
```

Finds template-spawned actors through the existing query API; the wrapper does not add a separate template-query method.

## Public type exports

```ts
type FrameworkAPI = AC<Components, Metadata>;
```

Names the typed framework API returned by `createAC`.

```ts
type ActorHandle = Actor<Components, Metadata>;
```

Names the actor instance type returned by framework operations. Consumers do not construct actors directly.

```ts
type HealthHandle = Component<Components, "health">;
```

Names a component instance type. Consumers obtain component instances from actors.

```ts
type CurrentState = State<Components, Metadata>;
```

Names the framework's in-memory state shape.

```ts
type CurrentStateSnapshot = StateSnapshot<Components, Metadata>;
```

Names the serializable snapshot of framework state.

```ts
type PlayerSnapshot = ActorSnapshot<Components, Metadata>;
```

Names an actor snapshot with the configured component and metadata types.

```ts
type HealthSnapshot = ComponentSnapshot<Components, "health">;
```

Names the snapshot shape for one component type.

```ts
type EventMap = FrameworkEvents<Components, Metadata>;
```

Names the event-to-payload mapping used by the framework.

```ts
type SpawnPayload = ActorEventPayload<Components, Metadata>;
```

Names the actor snapshot payload used by actor lifecycle events.

```ts
type ComponentPayload = ComponentEventPayload<Components, Metadata>;
```

Names the actor and component snapshot payload used by component events.

```ts
type ComponentMap = ComponentsBase;
```

Names the base constraint for component maps: each component key maps to an object value.

```ts
type SpawnOptions = TemplateSpawnOptions<Components, Metadata>;
```

## Dependency

`ac-state` uses the separate `event-bus` package. Generate it with `oside create --template bun-event-bus` from the consuming workspace root before installing dependencies. This template does not generate dependency packages automatically.

The package manifest declares `"event-bus": "workspace:*"`. For standalone use, provide a compatible `event-bus` package or replace that workspace dependency with an appropriate package source before installing.

Names the options accepted by template spawning, including the actor ID, metadata, and optional component overrides.
