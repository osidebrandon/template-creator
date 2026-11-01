import type { EventBus } from "event-bus";

export type ComponentsBase = Record<string, object>;

export type ComponentTypeKey<TComponents extends ComponentsBase> = Extract<
  keyof TComponents,
  string
>;

export type ComponentSnapshot<
  TComponents extends ComponentsBase,
  TComponentType extends ComponentTypeKey<TComponents> = ComponentTypeKey<TComponents>,
> = {
  [K in TComponentType]: { type: K } & TComponents[K];
}[TComponentType];

export type Component<
  TComponents extends ComponentsBase,
  TComponentType extends ComponentTypeKey<TComponents> = ComponentTypeKey<TComponents>,
  TComponentData extends TComponents[TComponentType] = TComponents[TComponentType],
> = {
  snapshot: () => ComponentSnapshot<TComponents, TComponentType>;
  getValue: () => TComponentData;
  setValue: (value: TComponentData) => void;
  remove: () => void;
};

export type ActorComponent<TComponents extends ComponentsBase> = Component<
  TComponents,
  ComponentTypeKey<TComponents>,
  TComponents[ComponentTypeKey<TComponents>]
>;

export type ActorSnapshotBase<TComponents extends ComponentsBase> = {
  id: string;
  components: Record<string, ComponentSnapshot<TComponents>>;
};

type ActorMetadataFields<TMetadata extends object | undefined> =
  [TMetadata] extends [undefined] ? {} : { metadata: TMetadata };

export type ActorSnapshot<
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined = undefined,
> = ActorSnapshotBase<TComponents> & ActorMetadataFields<TMetadata>;

type ActorMetadataApi<TMetadata extends object | undefined> =
  [TMetadata] extends [undefined]
    ? {}
    : {
        readonly metadata: TMetadata;
        setMetadata: (metadata: TMetadata) => void;
      };

export type Actor<
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined = undefined,
> = {
  id: string;
  components: Partial<
    Record<ComponentTypeKey<TComponents>, ActorComponent<TComponents>>
  >;
  snapshot: () => ActorSnapshot<TComponents, TMetadata>;
  getComponent: (
    type: ComponentTypeKey<TComponents>,
  ) => ActorComponent<TComponents> | undefined;
  queryComponents: (
    predicate: (
      component: ActorComponent<TComponents>,
      actor: Actor<TComponents, TMetadata>,
    ) => boolean,
  ) => ActorComponent<TComponents>[];
  addComponent: (
    snapshot: ComponentSnapshot<TComponents>,
  ) => ActorComponent<TComponents>;
  removeComponent: (
    type: ComponentTypeKey<TComponents>,
  ) => ActorComponent<TComponents> | undefined;
} & ActorMetadataApi<TMetadata>;

export type StateSnapshot<
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined = undefined,
> = {
  actors: Record<string, ActorSnapshot<TComponents, TMetadata>>;
};

export type ActorEvent = { readonly [actorEventFamily]: true };
export type ComponentEvent = { readonly [componentEventFamily]: true };

declare const actorEventFamily: unique symbol;
declare const componentEventFamily: unique symbol;

export type ActorEventPayload<
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined = undefined,
> = {
  actor: ActorSnapshot<TComponents, TMetadata>;
};

export type ComponentEventPayload<
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined = undefined,
> = {
  actor: ActorSnapshot<TComponents, TMetadata>;
  component: ComponentSnapshot<TComponents>;
};

export type EventPayload<
  TEvent extends ActorEvent | ComponentEvent,
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined = undefined,
> = TEvent extends ActorEvent
  ? ActorEventPayload<TComponents, TMetadata>
  : ComponentEventPayload<TComponents, TMetadata>;

export type FrameworkEvents<
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined = undefined,
> = {
  "actor:spawned": ActorEventPayload<TComponents, TMetadata>;
  "actor:changed": ActorEventPayload<TComponents, TMetadata>;
  "actor:destroyed": ActorEventPayload<TComponents, TMetadata>;
  "component:added": ComponentEventPayload<TComponents, TMetadata>;
  "component:changed": ComponentEventPayload<TComponents, TMetadata>;
  "component:removed": ComponentEventPayload<TComponents, TMetadata>;
};

export type State<
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined = undefined,
> = {
  actors: Record<string, Actor<TComponents, TMetadata>>;
};

export type ActorSnapshotCreator<
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined,
> = {
  <TActorMetadata extends TMetadata>(
    actorId: string,
    components: ComponentSnapshot<TComponents>[],
    metadata: TActorMetadata,
  ): ActorSnapshot<TComponents, TMetadata>;
} & ([TMetadata] extends [undefined]
  ? {
      (
        actorId: string,
        components: ComponentSnapshot<TComponents>[],
      ): ActorSnapshot<TComponents, TMetadata>;
    }
  : {});

export type AC<
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined = undefined,
> = {
  on: EventBus<FrameworkEvents<TComponents, TMetadata>>["on"];
  off: EventBus<FrameworkEvents<TComponents, TMetadata>>["off"];
  createEventHandler: <TEvent extends ActorEvent | ComponentEvent>(
    callback: (
      event: EventPayload<TEvent, TComponents, TMetadata>,
    ) => void | Promise<void>,
  ) => (
    event: EventPayload<TEvent, TComponents, TMetadata>,
  ) => void | Promise<void>;

  createStateSnapshot: (
    actors: ActorSnapshot<TComponents, TMetadata>[],
  ) => StateSnapshot<TComponents, TMetadata>;
  createActorSnapshot: ActorSnapshotCreator<TComponents, TMetadata>;

  initialize: (snapshot: StateSnapshot<TComponents, TMetadata>) => void;

  getActor: (actorId: string) => Actor<TComponents, TMetadata> | undefined;
  queryActors: (
    predicate: (actor: Actor<TComponents, TMetadata>) => boolean,
  ) => Actor<TComponents, TMetadata>[];
  spawnActor: (
    actor: ActorSnapshot<TComponents, TMetadata>,
  ) => Actor<TComponents, TMetadata>;
  destroyActor: (
    actorId: string,
  ) => Actor<TComponents, TMetadata> | undefined;
  queryComponents: (
    predicate: (
      component: ActorComponent<TComponents>,
      actor: Actor<TComponents, TMetadata>,
    ) => boolean,
  ) => ActorComponent<TComponents>[];
};
