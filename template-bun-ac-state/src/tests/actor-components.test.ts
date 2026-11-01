import { expect, test } from "bun:test";
import { createAC } from "../index.ts";
import type {
  ActorEventPayload,
  Component,
  ComponentEventPayload,
} from "../index.ts";

type TestComponents = {
  profile: { details: { displayName: string } };
  health: { current: number; max: number };
};

type TestMetadata = {
  type: string;
  team: string;
  details: { owner: string };
};

const getProfileDisplayName = (
  component: Component<TestComponents>,
): string => {
  const value = component.getValue();
  if (!("details" in value)) {
    throw new Error("Expected a profile component.");
  }

  return value.details.displayName;
};

test("snapshots and component event payloads are deep copies", () => {
  const ac = createAC<TestComponents>();
  const addedEvents: ComponentEventPayload<TestComponents>[] = [];
  const changedEvents: ComponentEventPayload<TestComponents>[] = [];
  const removedEvents: ComponentEventPayload<TestComponents>[] = [];

  ac.on("component:added", (event) => addedEvents.push(event));
  ac.on("component:changed", (event) => changedEvents.push(event));
  ac.on("component:removed", (event) => removedEvents.push(event));

  const actor = ac.spawnActor(ac.createActorSnapshot("actor-1", []));
  const profile = actor.addComponent({
    type: "profile",
    details: { displayName: "Ada" },
  });

  const componentSnapshot = profile.snapshot();
  if (componentSnapshot.type === "profile") {
    componentSnapshot.details.displayName = "Changed component snapshot";
  }
  expect(getProfileDisplayName(profile)).toBe("Ada");

  const actorSnapshot = actor.snapshot();
  const actorProfileSnapshot = actorSnapshot.components["profile"];
  if (actorProfileSnapshot.type === "profile") {
    actorProfileSnapshot.details.displayName = "Changed actor snapshot";
  }
  expect(getProfileDisplayName(profile)).toBe("Ada");

  const addedEvent = addedEvents[0];
  if (addedEvent.component.type === "profile") {
    addedEvent.component.details.displayName = "Changed added event";
  }
  const addedActorProfile = addedEvent.actor.components["profile"];
  if (addedActorProfile.type === "profile") {
    addedActorProfile.details.displayName = "Changed added actor event";
  }
  expect(getProfileDisplayName(profile)).toBe("Ada");

  profile.setValue({ details: { displayName: "Grace" } });
  expect(changedEvents[0].component.type).toBe("profile");
  if (changedEvents[0].component.type === "profile") {
    expect(changedEvents[0].component.details.displayName).toBe("Grace");
    changedEvents[0].component.details.displayName = "Changed event";
  }
  const changedActorProfile = changedEvents[0].actor.components["profile"];
  if (changedActorProfile.type === "profile") {
    changedActorProfile.details.displayName = "Changed actor event";
  }
  expect(getProfileDisplayName(profile)).toBe("Grace");

  expect(actor.removeComponent("profile")).toBe(profile);
  expect(actor.getComponent("profile")).toBeUndefined();
  expect(removedEvents[0].actor.components["profile"]).toBeUndefined();
  expect(removedEvents[0].component.type).toBe("profile");
});

test("duplicate IDs and component types are rejected; missing components are optional", () => {
  const ac = createAC<TestComponents>();
  const duplicateComponentSnapshot = [
    { type: "profile", details: { displayName: "Ada" } },
    { type: "profile", details: { displayName: "Grace" } },
  ] satisfies Parameters<typeof ac.createActorSnapshot>[1];

  expect(() =>
    ac.createActorSnapshot("actor-1", duplicateComponentSnapshot),
  ).toThrow(/Duplicate component type/);

  const actorSnapshot = ac.createActorSnapshot("actor-1", []);
  expect(() =>
    ac.createStateSnapshot([actorSnapshot, actorSnapshot]),
  ).toThrow(/Duplicate actor ID/);

  const actor = ac.spawnActor(actorSnapshot);
  expect(() => ac.spawnActor(actorSnapshot)).toThrow(/already exists/);
  expect(actor.getComponent("profile")).toBeUndefined();
  expect(actor.removeComponent("profile")).toBeUndefined();

  const profile = {
    type: "profile",
    details: { displayName: "Ada" },
  } satisfies Parameters<typeof actor.addComponent>[0];
  actor.addComponent(profile);
  expect(() => actor.addComponent(profile)).toThrow(/already has component/);
});

test("initialized actors publish component events through the framework bus", () => {
  const ac = createAC<TestComponents>();
  const changedEvents: ComponentEventPayload<TestComponents>[] = [];
  ac.on("component:changed", (event) => changedEvents.push(event));

  ac.initialize(
    ac.createStateSnapshot([
      ac.createActorSnapshot("initial", [
        { type: "health", current: 100, max: 100 },
      ]),
    ]),
  );

  ac.getActor("initial")
    ?.getComponent("health")
    ?.setValue({ current: 75, max: 100 });

  expect(changedEvents).toHaveLength(1);
  expect(changedEvents[0].component.type).toBe("health");
  if (changedEvents[0].component.type === "health") {
    expect(changedEvents[0].component.current).toBe(75);
  }
});

test("actor lifecycle event payloads describe the post-mutation state", () => {
  const ac = createAC<TestComponents>();
  const spawnedEvents: ActorEventPayload<TestComponents>[] = [];
  const destroyedEvents: ActorEventPayload<TestComponents>[] = [];
  ac.on("actor:spawned", (event) => spawnedEvents.push(event));
  ac.on("actor:destroyed", (event) => destroyedEvents.push(event));

  const actor = ac.spawnActor(ac.createActorSnapshot("actor-1", []));
  expect(spawnedEvents).toHaveLength(1);
  expect(ac.getActor(spawnedEvents[0].actor.id)).toBe(actor);

  expect(ac.destroyActor(actor.id)).toBe(actor);
  expect(destroyedEvents).toHaveLength(1);
  expect(ac.getActor(destroyedEvents[0].actor.id)).toBeUndefined();
});

test("metadata is omitted from the default actor and snapshot types", () => {
  const ac = createAC<TestComponents>();
  const snapshot = ac.createActorSnapshot("plain-actor", []);
  const actor = ac.spawnActor(snapshot);

  expect(Object.prototype.hasOwnProperty.call(snapshot, "metadata")).toBe(
    false,
  );
  expect(Object.prototype.hasOwnProperty.call(actor, "metadata")).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(actor, "setMetadata")).toBe(
    false,
  );

  if (false) {
    // @ts-expect-error Metadata is not part of the default actor type.
    actor.metadata;
    // @ts-expect-error setMetadata is only available with a metadata type.
    actor.setMetadata(undefined);
  }
});

test("metadata is copied into snapshots and changed through actor events", () => {
  const ac = createAC<TestComponents, TestMetadata>();
  const snapshot = ac.createActorSnapshot("actor-1", [
    { type: "health", current: 100, max: 100 },
  ], {
    type: "player",
    team: "blue",
    details: { owner: "Ada" },
  });
  const stateSnapshot = ac.createStateSnapshot([snapshot]);
  const restoredAC = createAC<TestComponents, TestMetadata>();
  restoredAC.initialize(stateSnapshot);

  const actor = restoredAC.getActor("actor-1");
  expect(actor?.metadata.type).toBe("player");
  expect(actor?.metadata.details.owner).toBe("Ada");

  const actorChanges: ActorEventPayload<TestComponents, TestMetadata>[] = [];
  let componentChanges = 0;
  restoredAC.on("actor:changed", (event) => actorChanges.push(event));
  restoredAC.on("component:changed", () => componentChanges++);

  actor?.getComponent("health")?.setValue({ current: 75, max: 100 });
  expect(actorChanges).toHaveLength(0);
  expect(componentChanges).toBe(1);

  actor?.setMetadata({
    type: "npc",
    team: "green",
    details: { owner: "Grace" },
  });

  expect(actorChanges).toHaveLength(1);
  expect(actorChanges[0].actor.metadata.type).toBe("npc");
  expect(actorChanges[0].actor.metadata.details.owner).toBe("Grace");
  expect(actor?.metadata.type).toBe("npc");

  actorChanges[0].actor.metadata.details.owner = "Changed event snapshot";
  expect(actor?.metadata.details.owner).toBe("Grace");

  const actorSnapshot = actor?.snapshot();
  if (actorSnapshot && "metadata" in actorSnapshot) {
    actorSnapshot.metadata.details.owner = "Changed actor snapshot";
  }
  expect(actor?.metadata.details.owner).toBe("Grace");

  // @ts-expect-error Metadata is required when the metadata type is provided.
  ac.createActorSnapshot("missing-metadata", []);
});
