import fs from 'fs-extra';
import path from 'path';
import { TEMPLATES_ROOT } from './create.js';
import {
  formatTemplateList,
  getBunTemplateAliases,
  TEMPLATE_MAP,
} from './templates.js';

describe('TEMPLATE_MAP', () => {
  it('keeps the existing aliases and registers the Bun templates', () => {
    expect(Object.keys(TEMPLATE_MAP).sort()).toEqual(
      [
        'bun-console',
        'bun-express',
        'bun-hono',
        'bun-logger',
        'bun-mono',
        'bun-package',
        'bun-vite-react',
        'bun-vite-vanilla',
        'bun-ac-state',
        'console',
        'bun-event-bus',
        'express',
        'package',
        'pixi-react',
        'pixi-vanilla',
        'sockets',
      ].sort()
    );
  });

  it('adds kind metadata only to Bun templates', () => {
    expect(getBunTemplateAliases('app')).toEqual([
      'bun-console',
      'bun-hono',
      'bun-express',
      'bun-vite-vanilla',
      'bun-vite-react',
    ]);
    expect(getBunTemplateAliases('package')).toEqual([
      'bun-ac-state',
      'bun-logger',
      'bun-package',
      'bun-event-bus',
    ]);
    expect(getBunTemplateAliases('workspace')).toEqual(['bun-mono']);

    for (const [alias, template] of Object.entries(TEMPLATE_MAP)) {
      if (template.kind) {
        expect(getBunTemplateAliases(template.kind)).toContain(alias);
      } else {
        expect(alias.startsWith('bun-')).toBe(false);
      }

      expect(template.directory).toMatch(/^template-/);
    }
  });

  it('points to local template directories with self-contained Bun component configs', async () => {
    for (const template of Object.values(TEMPLATE_MAP)) {
      expect(await fs.pathExists(path.join(TEMPLATES_ROOT, template.directory))).toBe(true);

      if (template.kind === 'app' || template.kind === 'package') {
        const tsconfig = await fs.readJson(
          path.join(TEMPLATES_ROOT, template.directory, 'tsconfig.json')
        );
        expect(tsconfig.extends).toBeUndefined();
      }
    }
  });

  it('lists Bun templates by kind and legacy templates without fixed paths', () => {
    const output = formatTemplateList();

    expect(output).toContain('Bun apps:');
    expect(output).toContain('Bun packages:');
    expect(output).toContain('Bun workspace:');
    expect(output).toContain('Legacy:');
    expect(output).toContain('  bun-hono');
    expect(output).toContain('  bun-package');
    expect(output).toContain('  bun-ac-state');
    expect(output).toContain('  bun-event-bus');
    expect(output).toContain('  express');
    expect(output).not.toContain('template-bun-hono');
    expect(output).not.toContain('apps/');
    expect(output).not.toContain('packages/');
  });
});
