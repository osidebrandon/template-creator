import { expect, test } from "bun:test";
import { EventBus } from "../index.ts";

type TestEvents = {
  "actor:created": { actorId: string };
  "actor:destroyed": { actorId: string };
};

test("publishes events only to listeners of that event", () => {
  const eventBus = new EventBus<TestEvents>();
  const created: TestEvents["actor:created"][] = [];
  const destroyed: TestEvents["actor:destroyed"][] = [];

  eventBus.on("actor:created", (event) => created.push(event));
  eventBus.on("actor:destroyed", (event) => destroyed.push(event));
  eventBus.publish("actor:created", { actorId: "player-0" });

  expect(created).toEqual([{ actorId: "player-0" }]);
  expect(destroyed).toEqual([]);
});

test("stops calling listeners removed with off", () => {
  const eventBus = new EventBus<TestEvents>();
  let calls = 0;
  const listener = () => {
    calls += 1;
  };

  eventBus.on("actor:created", listener);
  eventBus.publish("actor:created", { actorId: "player-0" });
  eventBus.off("actor:created", listener);
  eventBus.publish("actor:created", { actorId: "player-1" });

  expect(calls).toBe(1);
});

test("keeps methods bound when detached from the bus", () => {
  const { on, off, publish } = new EventBus<TestEvents>();
  const created: TestEvents["actor:created"][] = [];
  const listener = (event: TestEvents["actor:created"]) => {
    created.push(event);
  };

  on("actor:created", listener);
  publish("actor:created", { actorId: "player-0" });
  off("actor:created", listener);
  publish("actor:created", { actorId: "player-1" });

  expect(created).toEqual([{ actorId: "player-0" }]);
});
