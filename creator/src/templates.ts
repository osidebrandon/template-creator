export type TemplateKind = 'app' | 'package' | 'workspace';

export interface TemplateDefinition {
  directory: string;
  kind?: TemplateKind;
}

export const TEMPLATE_MAP: Record<string, TemplateDefinition> = {
  console: { directory: 'template-node-console' },
  'bun-console': { directory: 'template-bun-console', kind: 'app' },
  'bun-hono': { directory: 'template-bun-hono', kind: 'app' },
  'bun-express': { directory: 'template-bun-express', kind: 'app' },
  'bun-vite-vanilla': { directory: 'template-bun-vite-vanilla', kind: 'app' },
  'bun-vite-react': { directory: 'template-bun-vite-react', kind: 'app' },
  'bun-logger': { directory: 'template-bun-logger', kind: 'package' },
  'bun-package': { directory: 'template-bun-package', kind: 'package' },
  'bun-mono': { directory: 'template-bun-mono', kind: 'workspace' },
  package: { directory: 'template-node-package' },
  express: { directory: 'template-node-express' },
  sockets: { directory: 'template-node-express-sockets' },
  'pixi-react': { directory: 'template-react-pixi' },
  'pixi-vanilla': { directory: 'template-vanilla-pixi' },
};

export const getTemplateDefinition = (alias: string): TemplateDefinition | undefined =>
  Object.hasOwn(TEMPLATE_MAP, alias) ? TEMPLATE_MAP[alias] : undefined;

export type WorkspaceLocation = 'root' | 'apps' | 'packages';

export const getBunTemplateAliases = (kind?: TemplateKind): string[] =>
  Object.entries(TEMPLATE_MAP)
    .filter(([alias, template]) => alias.startsWith('bun-') && (!kind || template.kind === kind))
    .map(([alias]) => alias);

export const formatWorkspaceTemplateChoices = (location?: WorkspaceLocation): string => {
  const apps = getBunTemplateAliases('app');
  const packages = getBunTemplateAliases('package');

  if (location === 'apps') {
    return `Valid templates for apps/: ${apps.join(', ')}`;
  }
  if (location === 'packages') {
    return `Valid templates for packages/: ${packages.join(', ')}`;
  }

  return [
    'Valid Bun workspace templates:',
    `  apps: ${apps.join(', ')}`,
    `  packages: ${packages.join(', ')}`,
  ].join('\n');
};

export const formatTemplateList = (): string => {
  const apps = getBunTemplateAliases('app');
  const packages = getBunTemplateAliases('package');
  const workspaces = getBunTemplateAliases('workspace');
  const legacy = Object.entries(TEMPLATE_MAP)
    .filter(([, template]) => template.kind === undefined)
    .map(([alias]) => alias);

  return [
    'Bun apps:',
    ...apps.map((alias) => `  ${alias}`),
    'Bun packages:',
    ...packages.map((alias) => `  ${alias}`),
    'Bun workspace:',
    ...workspaces.map((alias) => `  ${alias}`),
    'Legacy:',
    ...legacy.map((alias) => `  ${alias}`),
  ].join('\n');
};
