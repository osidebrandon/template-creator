import type { Actor } from "./types.ts";
import type {
  AC,
  ComponentSnapshot,
  ComponentsBase,
} from "./types.ts";

export type TemplateDefinitionMap<TComponents extends ComponentsBase> = Record<
  string,
  readonly ComponentSnapshot<TComponents>[]
>;

export type TemplateSpawnOptions<
  TComponents extends ComponentsBase,
  TMetadata extends { type: string },
> = {
  id: string;
  metadata: TMetadata;
  componentOverrides?: readonly ComponentSnapshot<TComponents>[];
};

const assertUniqueComponentTypes = <TComponents extends ComponentsBase>(
  components: readonly ComponentSnapshot<TComponents>[],
  context: string,
): void => {
  const componentTypes = new Set<string>();

  for (const component of components) {
    if (componentTypes.has(component.type)) {
      throw new Error(
        `${context} contains duplicate component type "${component.type}".`,
      );
    }

    componentTypes.add(component.type);
  }
};

const mergeComponents = <TComponents extends ComponentsBase>(
  templateName: string,
  defaults: readonly ComponentSnapshot<TComponents>[],
  overrides: readonly ComponentSnapshot<TComponents>[],
): ComponentSnapshot<TComponents>[] => {
  assertUniqueComponentTypes(defaults, `Template "${templateName}"`);
  assertUniqueComponentTypes(
    overrides,
    `Overrides for template "${templateName}"`,
  );

  const componentsByType = new Map<string, ComponentSnapshot<TComponents>>();
  for (const component of defaults) {
    componentsByType.set(component.type, component);
  }
  for (const component of overrides) {
    componentsByType.set(component.type, component);
  }

  return [...componentsByType.values()];
};

export const createTemplateWrapper = <
  TComponents extends ComponentsBase,
  TMetadata extends { type: string },
  TTemplates extends TemplateDefinitionMap<TComponents>,
>(
  ac: AC<TComponents, TMetadata>,
  templates: TTemplates,
) => {
  type TemplateName = Extract<keyof TTemplates, string> & TMetadata["type"];

  const registeredTemplates = new Map<
    string,
    readonly ComponentSnapshot<TComponents>[]
  >();

  for (const [templateName, components] of Object.entries(templates)) {
    assertUniqueComponentTypes(components, `Template "${templateName}"`);
    registeredTemplates.set(templateName, components);
  }

  const spawnFromTemplate = <TTemplateName extends TemplateName>(
    templateName: TTemplateName,
    options: TemplateSpawnOptions<TComponents, TMetadata>,
  ): Actor<TComponents, TMetadata> => {
    const defaultComponents = registeredTemplates.get(templateName);
    if (!defaultComponents) {
      throw new Error(`Unknown actor template "${templateName}".`);
    }

    const components = mergeComponents(
      templateName,
      defaultComponents,
      options.componentOverrides ?? [],
    );
    const metadata = Object.assign({}, options.metadata, {
      type: templateName,
    });

    return ac.spawnActor(
      ac.createActorSnapshot(options.id, components, metadata),
    );
  };

  return { spawnFromTemplate };
};
