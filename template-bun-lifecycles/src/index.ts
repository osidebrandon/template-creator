export type LifecycleOptions = {
  onStart: () => void;
  onStop: () => void;
};

const terminationSignals =
  process.platform === "win32"
    ? (["SIGINT", "SIGTERM", "SIGBREAK"] as const)
    : (["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT"] as const);

export function lifecycle({ onStart, onStop }: LifecycleOptions): () => void {
  let stopped = false;

  const stop = () => {
    if (stopped) {
      return;
    }

    stopped = true;
    process.removeListener("exit", stop);

    for (const signal of terminationSignals) {
      process.removeListener(signal, stop);
    }

    onStop();
  };

  onStart();

  for (const signal of terminationSignals) {
    process.once(signal, stop);
  }

  process.once("exit", stop);

  return stop;
}
