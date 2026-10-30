import { TEMPLATE_MAP, DEFAULT_TEMPLATE } from './templates.js';

describe('TEMPLATE_MAP', () => {
  it('has the expected aliases', () => {
    expect(Object.keys(TEMPLATE_MAP).sort()).toEqual(
      [
        'bun-console',
        'bun-mono',
        'console',
        'express',
        'package',
        'pixi-react',
        'pixi-vanilla',
        'sockets',
      ].sort()
    );
  });

  it('default template is registered', () => {
    expect(TEMPLATE_MAP[DEFAULT_TEMPLATE]).toBeDefined();
  });

  it('all values point to template- directories', () => {
    for (const dir of Object.values(TEMPLATE_MAP)) {
      expect(dir).toMatch(/^template-/);
    }
  });
});
