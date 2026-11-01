import { EventBus } from "event-bus";
import { cloneJson } from "./clone-json.ts";
import { ComponentInstance } from "./component.ts";
import type {
  Actor,
  ActorComponent,
  ActorSnapshot,
  ActorSnapshotBase,
  ComponentSnapshot,
  ComponentTypeKey,
  ComponentsBase,
  FrameworkEvents,
} from "./types.ts";

export class ActorInstance<
  TComponents extends ComponentsBase,
  TMetadata extends object | undefined = undefined,
> {
  public id: string;
  public components: Partial<
    Record<ComponentTypeKey<TComponents>, ActorComponent<TComponents>>
  >;
  declare metadata: TMetadata;
  declare setMetadata: (metadata: TMetadata) => void;
  private metadataValue: TMetadata | undefined;
  private hasMetadata: boolean;

  constructor(
    snapshot: ActorSnapshot<TComponents, TMetadata>,
    private readonly eventBus: EventBus<
      FrameworkEvents<TComponents, TMetadata>
    > = new EventBus<FrameworkEvents<TComponents, TMetadata>>(),
  ) {
    this.id = snapshot.id;
    const snapshotWithMetadata = snapshot as ActorSnapshotBase<TComponents> & {
      metadata?: TMetadata;
    };
    this.hasMetadata = Object.prototype.hasOwnProperty.call(
      snapshot,
      "metadata",
    );
    this.metadataValue = snapshotWithMetadata.metadata;
    if (this.hasMetadata) {
      this.attachMetadataApi();
    }

    const components: Partial<
      Record<ComponentTypeKey<TComponents>, ActorComponent<TComponents>>
    > = Object.create(null);

    for (const componentSnapshot of Object.values(snapshot.components)) {
      const type = componentSnapshot.type;
      if (Object.prototype.hasOwnProperty.call(components, type)) {
        throw new Error(
          `Actor "${this.id}" has duplicate component type "${String(type)}".`,
        );
      }

      components[type] = new ComponentInstance<
        TComponents,
        ComponentTypeKey<TComponents>,
        TComponents[ComponentTypeKey<TComponents>],
        TMetadata
      >(
        componentSnapshot,
        this,
        this.eventBus,
      );
    }

    this.components = components;
  }

  snapshot = (): ActorSnapshot<TComponents, TMetadata> => {
    const components = Object.create(null) as ActorSnapshotBase<
      TComponents
    >["components"];

    for (const [type, component] of Object.entries(this.components)) {
      if (component) {
        components[type] = component.snapshot();
      }
    }

    const snapshot = { id: this.id, components };
    if (!this.hasMetadata) {
      return snapshot as ActorSnapshot<TComponents, TMetadata>;
    }

    return {
      ...snapshot,
      metadata: cloneJson(this.metadataValue),
    } as ActorSnapshot<TComponents, TMetadata>;
  };

  getComponent = (
    type: ComponentTypeKey<TComponents>,
  ): ActorComponent<TComponents> | undefined => {
    return this.components[type];
  };

  queryComponents = (
    predicate: (
      component: ActorComponent<TComponents>,
      actor: Actor<TComponents, TMetadata>,
    ) => boolean,
  ): ActorComponent<TComponents>[] => {
    const components: ActorComponent<TComponents>[] = [];

    for (const component of Object.values(this.components)) {
      if (component && predicate(component, this)) {
        components.push(component);
      }
    }

    return components;
  };

  addComponent = (
    componentSnapshot: ComponentSnapshot<TComponents>,
  ): ActorComponent<TComponents> => {
    const type = componentSnapshot.type;
    if (Object.prototype.hasOwnProperty.call(this.components, type)) {
      throw new Error(
        `Actor "${this.id}" already has component "${String(type)}".`,
      );
    }

    const component = new ComponentInstance<
      TComponents,
      ComponentTypeKey<TComponents>,
      TComponents[ComponentTypeKey<TComponents>],
      TMetadata
    >(
      componentSnapshot,
      this,
      this.eventBus,
    );

    this.components[type] = component;
    this.eventBus.publish("component:added", {
      actor: this.snapshot(),
      component: component.snapshot(),
    });

    return component;
  };

  removeComponent = (
    type: ComponentTypeKey<TComponents>,
  ): ActorComponent<TComponents> | undefined => {
    const component = this.components[type];
    if (!component) {
      return undefined;
    }

    delete this.components[type];
    this.eventBus.publish("component:removed", {
      actor: this.snapshot(),
      component: component.snapshot(),
    });

    return component;
  };

  private attachMetadataApi = (): void => {
    Object.defineProperty(this, "metadata", {
      configurable: true,
      enumerable: true,
      get: () => this.metadataValue,
    });
    Object.defineProperty(this, "setMetadata", {
      configurable: true,
      value: this.setMetadataInternal,
    });
  };

  private setMetadataInternal = (metadata: TMetadata): void => {
    this.metadataValue = metadata;
    if (!this.hasMetadata) {
      this.hasMetadata = true;
      this.attachMetadataApi();
    }

    this.eventBus.publish("actor:changed", { actor: this.snapshot() });
  };
}
