export type Listener<TEvent> = (event: TEvent) => void;

export class EventBus<TEvents extends object> {
  readonly #listeners = new Map<keyof TEvents, Set<Listener<never>>>();

  // Arrow properties stay bound, so methods can be passed around (e.g. `on: eventBus.on`).
  on = <TName extends keyof TEvents>(
    eventName: TName,
    listener: Listener<TEvents[TName]>,
  ): void => {
    let listeners = this.#listeners.get(eventName);

    if (!listeners) {
      listeners = new Set();
      this.#listeners.set(eventName, listeners);
    }

    listeners.add(listener);
  };

  off = <TName extends keyof TEvents>(
    eventName: TName,
    listener: Listener<TEvents[TName]>,
  ): void => {
    const listeners = this.#listeners.get(eventName);

    if (!listeners) {
      return;
    }

    listeners.delete(listener);

    if (listeners.size === 0) {
      this.#listeners.delete(eventName);
    }
  };

  publish = <TName extends keyof TEvents>(
    eventName: TName,
    event: TEvents[TName],
  ): void => {
    const listeners = this.#listeners.get(eventName);

    if (!listeners) {
      return;
    }

    for (const listener of [...listeners] as Listener<TEvents[TName]>[]) {
      listener(event);
    }
  };
}
