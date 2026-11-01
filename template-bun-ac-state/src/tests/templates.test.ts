import { expect, test } from "bun:test";
import {
  createAC,
  createTemplateWrapper,
  type TemplateDefinitionMap,
} from "../index.ts";

type TestComponents = {
  profile: { displayName: string };
  health: { current: number; max: number };
  status: { state: string };
};

type TestMetadata = {
  type: "player" | "npc";
  faction?: string;
};

const templates = {
  player: [
    { type: "profile", displayName: "Default player" },
    { type: "health", current: 100, max: 100 },
  ],
  npc: [
    { type: "profile", displayName: "Default NPC" },
    { type: "health", current: 40, max: 40 },
  ],
} satisfies TemplateDefinitionMap<TestComponents>;

test("template spawning merges defaults and overrides with template metadata", () => {
  const ac = createAC<TestComponents, TestMetadata>();
  const templateWrapper = createTemplateWrapper(ac, templates);

  const actor = templateWrapper.spawnFromTemplate("player", {
    id: "player-1",
    metadata: { type: "npc", faction: "blue" },
    componentOverrides: [
      { type: "health", current: 70, max: 100 },
      { type: "status", state: "ready" },
    ],
  });

  expect(actor.metadata).toEqual({ type: "player", faction: "blue" });
  expect(ac.queryActors((candidate) => candidate.metadata.type === "player"))
    .toEqual([actor]);

  const profile = actor.getComponent("profile")?.snapshot();
  if (profile?.type === "profile") {
    expect(profile.displayName).toBe("Default player");
  }

  const health = actor.getComponent("health")?.snapshot();
  if (health?.type === "health") {
    expect(health.current).toBe(70);
  }

  const status = actor.getComponent("status")?.snapshot();
  if (status?.type === "status") {
    expect(status.state).toBe("ready");
  }

  actor.setMetadata({ type: "npc", faction: "green" });
  expect(ac.queryActors((candidate) => candidate.metadata.type === "player"))
    .toHaveLength(0);
});

test("template names are restricted to mapping keys", () => {
  const ac = createAC<TestComponents, TestMetadata>();
  const templateWrapper = createTemplateWrapper(ac, templates);

  if (false) {
    // @ts-expect-error Template names must come from the template map.
    templateWrapper.spawnFromTemplate("enemy", {
      id: "enemy-1",
      metadata: { type: "player" },
    });
  }
});

test("duplicate template and override component types are rejected", () => {
  const ac = createAC<TestComponents, TestMetadata>();

  expect(() =>
    createTemplateWrapper(ac, {
      invalid: [
        { type: "status", state: "first" },
        { type: "status", state: "second" },
      ],
    }),
  ).toThrow(/duplicate component type/);

  const templateWrapper = createTemplateWrapper(ac, templates);
  expect(() =>
    templateWrapper.spawnFromTemplate("player", {
      id: "player-duplicate",
      metadata: { type: "npc" },
      componentOverrides: [
        { type: "health", current: 10, max: 10 },
        { type: "health", current: 20, max: 20 },
      ],
    }),
  ).toThrow(/duplicate component type/);
});
