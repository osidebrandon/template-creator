import type { EventBus } from "event-bus";
import { cloneJson } from "./clone-json.ts";
import type {
  Actor,
  ComponentSnapshot,
  ComponentTypeKey,
  ComponentsBase,
  FrameworkEvents,
} from "./types.ts";

export class ComponentInstance<
  TComponents extends ComponentsBase,
  TComponentType extends ComponentTypeKey<TComponents> = ComponentTypeKey<TComponents>,
  TComponentData extends TComponents[TComponentType] = TComponents[TComponentType],
  TMetadata extends object | undefined = undefined,
> {
  private _value: TComponentData;
  private readonly componentType: TComponentType;

  constructor(
    snapshot: ComponentSnapshot<TComponents, TComponentType>,
    private readonly actor: Actor<TComponents, TMetadata>,
    private readonly eventBus: EventBus<FrameworkEvents<TComponents, TMetadata>>,
  ) {
    const { type, ...value } = snapshot;
    this.componentType = type;
    this._value = value as TComponentData;
  }

  snapshot = (): ComponentSnapshot<TComponents, TComponentType> => {
    return cloneJson({
      ...this._value,
      type: this.componentType,
    }) as ComponentSnapshot<TComponents, TComponentType>;
  };

  getValue = (): TComponentData => {
    return this._value;
  };

  setValue = (value: TComponentData): void => {
    this._value = value;

    this.eventBus.publish("component:changed", {
      actor: this.actor.snapshot(),
      component: this.snapshot(),
    });
  };

  remove = (): void => {
    this.actor.removeComponent(this.componentType);
  };
}
