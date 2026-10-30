/**
 * Maps the short --template alias to the actual template directory name.
 * Add new templates here.
 */
export const TEMPLATE_MAP: Record<string, string> = {
  console: 'template-node-console',
  'bun-console': 'template-bun-console',
  'bun-mono': 'template-bun-mono',
  package: 'template-node-package',
  express: 'template-node-express',
  sockets: 'template-node-express-sockets',
  'pixi-react': 'template-react-pixi',
  'pixi-vanilla': 'template-vanilla-pixi',
};

export const DEFAULT_TEMPLATE = 'console';
