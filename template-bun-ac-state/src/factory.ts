import { EventBus } from "event-bus";
import { ActorInstance } from "./actor.ts";
import type {
  AC,
  ActorEvent,
  Actor,
  ActorComponent,
  ActorSnapshot,
  ActorSnapshotBase,
  ComponentEvent,
  ComponentSnapshot,
  ComponentsBase,
  EventPayload,
  FrameworkEvents,
  State,
  StateSnapshot,
} from "./types.ts";

export const createAC = <
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined = undefined,
>(): AC<TComponents, TMetadata> => {
  const eventBus = new EventBus<FrameworkEvents<TComponents, TMetadata>>();
  const state: State<TComponents, TMetadata> = {
    actors: Object.create(null),
  };
  const createActor = (
    snapshot: ActorSnapshot<TComponents, TMetadata>,
  ): Actor<TComponents, TMetadata> =>
    new ActorInstance(snapshot, eventBus) as Actor<TComponents, TMetadata>;

  return {
    initialize: ({ actors }: StateSnapshot<TComponents, TMetadata>) => {
      const initializedActors = Object.create(null) as State<
        TComponents,
        TMetadata
      >["actors"];

      for (const actorSnapshot of Object.values(actors)) {
        if (
          Object.prototype.hasOwnProperty.call(
            initializedActors,
            actorSnapshot.id,
          )
        ) {
          throw new Error(
            `Duplicate actor ID "${actorSnapshot.id}" in state snapshot.`,
          );
        }

        initializedActors[actorSnapshot.id] = createActor(actorSnapshot);
      }

      state.actors = initializedActors;
    },
    createStateSnapshot: (
      actors: ActorSnapshot<TComponents, TMetadata>[],
    ) => {
      const actorSnapshots = Object.create(null) as StateSnapshot<
        TComponents,
        TMetadata
      >["actors"];

      for (const actorSnapshot of actors) {
        if (
          Object.prototype.hasOwnProperty.call(
            actorSnapshots,
            actorSnapshot.id,
          )
        ) {
          throw new Error(
            `Duplicate actor ID "${actorSnapshot.id}" in state snapshot.`,
          );
        }

        actorSnapshots[actorSnapshot.id] = actorSnapshot;
      }

      return { actors: actorSnapshots };
    },
    createActorSnapshot: (
      actorId: string,
      components: ComponentSnapshot<TComponents>[],
      metadata?: TMetadata,
    ) => {
      const actorComponents = Object.create(null) as ActorSnapshotBase<
        TComponents
      >["components"];

      for (const componentSnapshot of components) {
        const type = componentSnapshot.type;
        if (Object.prototype.hasOwnProperty.call(actorComponents, type)) {
          throw new Error(
            `Duplicate component type "${String(type)}" for actor "${actorId}".`,
          );
        }

        actorComponents[type] = componentSnapshot;
      }

      const snapshot = {
        id: actorId,
        components: actorComponents,
      };
      if (metadata === undefined) {
        return snapshot as ActorSnapshot<TComponents, TMetadata>;
      }

      return {
        ...snapshot,
        metadata,
      } as ActorSnapshot<TComponents, TMetadata>;
    },
    getActor: (actorId: string) => {
      return state.actors[actorId];
    },
    queryActors: (
      predicate: (actor: Actor<TComponents, TMetadata>) => boolean,
    ) => {
      return Object.values(state.actors).filter(predicate);
    },
    spawnActor: (actorSnapshot: ActorSnapshot<TComponents, TMetadata>) => {
      if (Object.prototype.hasOwnProperty.call(state.actors, actorSnapshot.id)) {
        throw new Error(`Actor "${actorSnapshot.id}" already exists.`);
      }

      const actor = createActor(actorSnapshot);
      state.actors[actor.id] = actor;
      eventBus.publish("actor:spawned", { actor: actor.snapshot() });
      return actor;
    },
    destroyActor: (actorId: string) => {
      const actor = state.actors[actorId];

      if (actor) {
        delete state.actors[actorId];
        eventBus.publish("actor:destroyed", { actor: actor.snapshot() });
      }

      return actor;
    },
    queryComponents: (
      predicate: (
        component: ActorComponent<TComponents>,
        actor: Actor<TComponents, TMetadata>,
      ) => boolean,
    ) => {
      return Object.values(state.actors).reduce<
        ActorComponent<TComponents>[]
      >((components, actor) => {
        Object.values(actor.components).forEach((component) => {
          if (component && predicate(component, actor)) {
            components.push(component);
          }
        });
        return components;
      }, []);
    },
    on: eventBus.on,
    off: eventBus.off,
    createEventHandler: <TEvent extends ActorEvent | ComponentEvent>(
      callback: (
        event: EventPayload<TEvent, TComponents, TMetadata>,
      ) => void | Promise<void>,
    ) => callback,
  };
};
