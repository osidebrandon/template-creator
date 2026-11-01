import { expect, test } from "bun:test";
import { lifecycle } from "../index.ts";

const terminationSignals =
  process.platform === "win32"
    ? (["SIGINT", "SIGTERM", "SIGBREAK"] as const)
    : (["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT"] as const);

test("starts immediately and stops once after a termination signal", () => {
  const previousListeners = new Map(
    terminationSignals.map((signal) => [signal, process.listeners(signal)]),
  );
  const previousExitListeners = process.listeners("exit");
  let startCalls = 0;
  let stopCalls = 0;

  const stop = lifecycle({
    onStart: () => {
      startCalls += 1;
    },
    onStop: () => {
      stopCalls += 1;
    },
  });

  try {
    expect(startCalls).toBe(1);

    const signalListener = process
      .listeners("SIGINT")
      .find((listener) => !previousListeners.get("SIGINT")?.includes(listener));
    expect(signalListener).toBeDefined();

    if (signalListener) {
      Reflect.apply(signalListener, process, []);
    }

    expect(stopCalls).toBe(1);

    for (const signal of terminationSignals) {
      expect(
        process
          .listeners(signal)
          .some((listener) => !previousListeners.get(signal)?.includes(listener)),
      ).toBe(false);
    }

    expect(process.listeners("exit")).toEqual(previousExitListeners);

    stop();
    expect(stopCalls).toBe(1);
  } finally {
    stop();
  }
});

test("stops on normal process exit", () => {
  const previousExitListeners = process.listeners("exit");
  let stopCalls = 0;

  const stop = lifecycle({
    onStart: () => {},
    onStop: () => {
      stopCalls += 1;
    },
  });

  try {
    const exitListener = process
      .listeners("exit")
      .find((listener) => !previousExitListeners.includes(listener));
    expect(exitListener).toBeDefined();

    if (exitListener) {
      Reflect.apply(exitListener, process, []);
    }

    expect(stopCalls).toBe(1);
    expect(process.listeners("exit")).toEqual(previousExitListeners);
  } finally {
    stop();
  }
});
