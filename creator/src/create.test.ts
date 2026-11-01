import fs from 'fs-extra';
import path from 'path';
import {
  createProject,
  findBunWorkspaceContext,
  findBunWorkspaceRoot,
  isSafePathSegment,
  parseWorkspaceProjectEntry,
  TEMPLATES_ROOT,
} from './create.js';
import { TEMPLATE_MAP } from './templates.js';

const TEST_ROOT = path.join(TEMPLATES_ROOT, 'creator', '.oside-test-output');
const FIXTURE_TEMPLATES = path.join(TEST_ROOT, 'templates');

const makeTemplates = async (): Promise<void> => {
  for (const [alias, template] of Object.entries(TEMPLATE_MAP)) {
    const source = path.join(FIXTURE_TEMPLATES, template.directory);
    await fs.ensureDir(source);
    await fs.writeJson(path.join(source, 'package.json'), {
      name: template.kind === 'package' ? alias.replace(/^bun-/, '') : `template-${alias}`,
      version: '1.0.0',
      scripts: alias === 'bun-mono' ? { keep: 'unchanged' } : {},
      ...(alias === 'bun-mono' ? { workspaces: ['apps/*', 'packages/*'] } : {}),
    });
    await fs.ensureDir(path.join(source, 'src'));
    await fs.writeFile(path.join(source, 'src', 'index.ts'), `export const name = '${alias}';\n`);
  }
};

const makeWorkspace = async (
  root: string,
  workspaces: unknown = ['apps/*', 'packages/*']
): Promise<void> => {
  await fs.ensureDir(path.join(root, 'apps'));
  await fs.ensureDir(path.join(root, 'packages'));
  await fs.writeJson(path.join(root, 'package.json'), { workspaces });
};

const createOptions = (cwd: string, template = 'bun-console', projects?: string[]) => ({
  template,
  projects,
  cwd,
  templatesRoot: FIXTURE_TEMPLATES,
});

beforeEach(async () => {
  await fs.remove(TEST_ROOT);
  await fs.ensureDir(TEST_ROOT);
  await makeTemplates();
});

afterEach(async () => {
  await fs.remove(TEST_ROOT);
});

describe('project and folder validation', () => {
  it('accepts safe single path segments and rejects absolute or traversing paths', () => {
    expect(isSafePathSegment('my-project')).toBe(true);
    expect(isSafePathSegment('..')).toBe(false);
    expect(isSafePathSegment('../escape')).toBe(false);
    expect(isSafePathSegment('nested/project')).toBe(false);
    expect(isSafePathSegment('nested\\project')).toBe(false);
    expect(isSafePathSegment('C:\\outside')).toBe(false);
    expect(isSafePathSegment('folder:stream')).toBe(false);
  });

  it('parses template names and optional workspace folder overrides', () => {
    expect(parseWorkspaceProjectEntry('bun-console')).toEqual({
      template: 'bun-console',
      folder: 'bun-console',
    });
    expect(parseWorkspaceProjectEntry('bun-hono=api')).toEqual({
      template: 'bun-hono',
      folder: 'api',
    });
    expect(() => parseWorkspaceProjectEntry('bun-hono=api=other')).toThrow('at most one');
  });
});

describe('Bun workspace detection and routing', () => {
  it('finds a workspace by its package.json globs without a special name or lockfile', async () => {
    const root = path.join(TEST_ROOT, 'workspace');
    await makeWorkspace(root);

    await expect(findBunWorkspaceRoot(path.join(root, 'apps'))).resolves.toBe(root);
    await expect(findBunWorkspaceContext(root)).resolves.toEqual({ root, location: 'root' });
    await expect(findBunWorkspaceContext(path.join(root, 'packages'))).resolves.toEqual({
      root,
      location: 'packages',
    });
  });

  it('recognizes the package-object workspaces form but requires both workspace globs', async () => {
    const root = path.join(TEST_ROOT, 'workspace');
    await makeWorkspace(root, { packages: ['apps/*', 'packages/*'] });

    await expect(findBunWorkspaceRoot(path.join(root, 'apps'))).resolves.toBe(root);

    const incompleteRoot = path.join(TEST_ROOT, 'incomplete');
    await makeWorkspace(incompleteRoot, ['apps/*']);
    await expect(findBunWorkspaceRoot(path.join(incompleteRoot, 'apps'))).resolves.toBeUndefined();
  });

  it('routes root-created apps and packages and uses the destination folder as package name', async () => {
    const root = path.join(TEST_ROOT, 'workspace');
    await makeWorkspace(root);

    const app = await createProject('my-app', createOptions(root, 'bun-hono'));
    const packageProject = await createProject('my-lib', createOptions(root, 'bun-package'));
    const defaultPackageProject = await createProject(
      undefined,
      createOptions(root, 'bun-event-bus')
    );

    expect(app.created[0].destination).toBe(path.join(root, 'apps', 'my-app'));
    expect(packageProject.created[0].destination).toBe(path.join(root, 'packages', 'my-lib'));
    expect(defaultPackageProject.created[0].destination).toBe(
      path.join(root, 'packages', 'event-bus')
    );
    expect(app.installRoot).toBe(root);
    expect(app.installCommand).toBe('bun install');
    await expect(fs.readJson(path.join(root, 'apps', 'my-app', 'package.json'))).resolves.toMatchObject({
      name: 'my-app',
    });
    await expect(
      fs.readJson(path.join(root, 'packages', 'my-lib', 'package.json'))
    ).resolves.toMatchObject({ name: 'my-lib' });
    await expect(
      fs.readJson(path.join(root, 'packages', 'event-bus', 'package.json'))
    ).resolves.toMatchObject({ name: 'event-bus' });
    await expect(fs.readJson(path.join(root, 'package.json'))).resolves.toEqual({ workspaces: ['apps/*', 'packages/*'] });
  });

  it('creates directly in apps or packages and rejects the opposite template kind', async () => {
    const root = path.join(TEST_ROOT, 'workspace');
    const apps = path.join(root, 'apps');
    const packages = path.join(root, 'packages');
    await makeWorkspace(root);

    const app = await createProject('direct-app', createOptions(apps, 'bun-console'));
    const packageProject = await createProject(
      'direct-package',
      createOptions(packages, 'bun-logger')
    );
    expect(app.created[0].destination).toBe(path.join(apps, 'direct-app'));
    expect(packageProject.created[0].destination).toBe(path.join(packages, 'direct-package'));

    await expect(createProject('wrong-kind', createOptions(apps, 'bun-logger'))).rejects.toThrow(
      'apps/ accepts app templates only'
    );
    await expect(createProject('wrong-kind', createOptions(packages, 'bun-hono'))).rejects.toThrow(
      'packages/ accepts package templates only'
    );
    await expect(createProject('legacy', createOptions(root, 'express'))).rejects.toThrow(
      'standalone-only'
    );
    await expect(createProject('nested-root', createOptions(root, 'bun-mono'))).rejects.toThrow(
      'workspace root'
    );
  });

  it('rejects creation from deeper workspace paths', async () => {
    const root = path.join(TEST_ROOT, 'workspace');
    const nested = path.join(root, 'apps', 'existing-app');
    await makeWorkspace(root);
    await fs.ensureDir(nested);

    await expect(createProject('child', createOptions(nested))).rejects.toThrow(
      'below a Bun workspace child'
    );
  });

  it('reports malformed ancestor package.json files rather than silently ignoring them', async () => {
    const cwd = path.join(TEST_ROOT, 'malformed');
    await fs.ensureDir(cwd);
    await fs.writeFile(path.join(cwd, 'package.json'), '{invalid');

    await expect(findBunWorkspaceRoot(cwd)).rejects.toThrow('Unable to read package manifest');
  });
});

describe('project creation', () => {
  it('creates standalone Bun and legacy projects under CWD with manual install guidance', async () => {
    const cwd = path.join(TEST_ROOT, 'standalone');
    await fs.ensureDir(cwd);

    const bun = await createProject('my-bun-app', createOptions(cwd, 'bun-console'));
    const legacy = await createProject('my-node-app', createOptions(cwd, 'console'));

    expect(bun.created[0].destination).toBe(path.join(cwd, 'my-bun-app'));
    expect(bun.installCommand).toBe('bun install');
    expect(legacy.created[0].destination).toBe(path.join(cwd, 'my-node-app'));
    expect(legacy.installCommand).toBe('yarn install');
    await expect(
      fs.readJson(path.join(cwd, 'my-bun-app', 'package.json'))
    ).resolves.toMatchObject({ name: 'my-bun-app', version: '0.0.1' });
  });

  it('defaults package projects to their manifest name and allows renaming', async () => {
    const cwd = path.join(TEST_ROOT, 'default-package');
    await fs.ensureDir(cwd);

    const defaultPackage = await createProject(undefined, createOptions(cwd, 'bun-event-bus'));
    const renamedPackage = await createProject(
      'custom-event-bus',
      createOptions(cwd, 'bun-event-bus')
    );

    expect(defaultPackage.created[0].destination).toBe(path.join(cwd, 'event-bus'));
    expect(renamedPackage.created[0].destination).toBe(path.join(cwd, 'custom-event-bus'));
    await expect(
      fs.readJson(path.join(cwd, 'event-bus', 'package.json'))
    ).resolves.toMatchObject({ name: 'event-bus' });
    await expect(
      fs.readJson(path.join(cwd, 'custom-event-bus', 'package.json'))
    ).resolves.toMatchObject({ name: 'custom-event-bus' });
    await expect(createProject(undefined, createOptions(cwd, 'bun-console'))).rejects.toThrow(
      'Project name is required for template "bun-console".'
    );
  });

  it('reports an invalid template package name instead of silently choosing a fallback', async () => {
    const cwd = path.join(TEST_ROOT, 'invalid-default-package');
    await fs.ensureDir(cwd);
    const manifestPath = path.join(
      FIXTURE_TEMPLATES,
      TEMPLATE_MAP['bun-event-bus'].directory,
      'package.json'
    );
    await fs.writeJson(manifestPath, { version: '1.0.0' });

    await expect(createProject(undefined, createOptions(cwd, 'bun-event-bus'))).rejects.toThrow(
      'must have a non-empty package.json name'
    );
  });

  it('creates every valid bootstrap component and retains partial output after failures', async () => {
    const cwd = path.join(TEST_ROOT, 'bootstrap-parent');
    await fs.ensureDir(cwd);

    const result = await createProject('my-mono', {
      ...createOptions(cwd, 'bun-mono', [
        'bun-hono=api',
        'console',
        'bun-logger',
        'bun-event-bus',
        'bun-lifecycles',
        'bun-mono',
        'bun-package=../escape',
      ]),
    });
    const root = path.join(cwd, 'my-mono');

    expect(result.created.map((project) => project.destination)).toEqual([
      root,
      path.join(root, 'apps', 'api'),
      path.join(root, 'packages', 'logger'),
      path.join(root, 'packages', 'event-bus'),
      path.join(root, 'packages', 'lifecycles'),
    ]);
    expect(result.failures).toHaveLength(3);
    expect(result.validProjectChoices).toContain('apps: bun-console, bun-hono');
    expect(result.validProjectChoices).toContain(
      'packages: bun-ac-state, bun-logger, bun-package, bun-event-bus, bun-lifecycles'
    );
    expect(result.installRoot).toBe(root);
    expect(result.installCommand).toBe('bun install');
    await expect(fs.readJson(path.join(root, 'package.json'))).resolves.toMatchObject({
      name: 'my-mono',
      scripts: { keep: 'unchanged' },
      workspaces: ['apps/*', 'packages/*'],
    });
    await expect(fs.readJson(path.join(root, 'apps', 'api', 'package.json'))).resolves.toMatchObject({
      name: 'api',
    });
    await expect(
      fs.readJson(path.join(root, 'packages', 'logger', 'package.json'))
    ).resolves.toMatchObject({ name: 'logger' });
    await expect(
      fs.readJson(path.join(root, 'packages', 'event-bus', 'package.json'))
    ).resolves.toMatchObject({ name: 'event-bus' });
    await expect(
      fs.readJson(path.join(root, 'packages', 'lifecycles', 'package.json'))
    ).resolves.toMatchObject({ name: 'lifecycles' });
  });

  it('continues a workspace batch after a destination collision', async () => {
    const cwd = path.join(TEST_ROOT, 'bootstrap-parent');
    await fs.ensureDir(cwd);

    const result = await createProject('my-mono', {
      ...createOptions(cwd, 'bun-mono', [
        'bun-console=web',
        'bun-vite-react=web',
        'bun-package=utilities',
      ]),
    });
    const root = path.join(cwd, 'my-mono');

    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toContain('Destination already exists');
    expect(await fs.pathExists(path.join(root, 'apps', 'web', 'src', 'index.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(root, 'packages', 'utilities', 'package.json'))).toBe(true);
  });

  it('rejects unsafe project names and lists valid aliases for unknown templates', async () => {
    const cwd = path.join(TEST_ROOT, 'standalone');
    await fs.ensureDir(cwd);

    await expect(createProject('../escape', createOptions(cwd))).rejects.toThrow(
      'safe single path segment'
    );
    await expect(createProject('name', createOptions(cwd, 'missing'))).rejects.toThrow(
      'Available templates:'
    );
    await expect(createProject('name', createOptions(cwd, 'constructor'))).rejects.toThrow(
      'Unknown template alias'
    );
  });
});
