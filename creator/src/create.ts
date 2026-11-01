import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  formatWorkspaceTemplateChoices,
  getBunTemplateAliases,
  getTemplateDefinition,
  TEMPLATE_MAP,
  type TemplateDefinition,
  type WorkspaceLocation,
} from './templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TEMPLATES_ROOT = path.resolve(__dirname, '..', '..');

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.yarn']);
const SKIP_FILES = new Set(['yarn.lock', 'yarn-error.log', 'bun.lock', 'bun.lockb', '.env']);
const INVALID_PATH_SEGMENT_CHARACTERS = /[<>:"/\\|?*]/;
const WINDOWS_RESERVED_PATH_SEGMENT = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

interface PackageManifest {
  name?: unknown;
  workspaces?: unknown;
}

export interface BunWorkspaceContext {
  root: string;
  location: WorkspaceLocation;
}

export interface CreateProjectOptions {
  template: string;
  projects?: string[];
  cwd?: string;
  templatesRoot?: string;
}

export interface CreatedProject {
  alias: string;
  name: string;
  templateDirectory: string;
  destination: string;
}

export interface CreateProjectResult {
  cwd: string;
  created: CreatedProject[];
  failures: string[];
  installRoot: string;
  installCommand: 'bun install' | 'yarn install';
  validProjectChoices?: string;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const isSafePathSegment = (value: string): boolean => {
  if (!value || value === '.' || value === '..') return false;
  if (value.trim() !== value || value.endsWith('.')) return false;
  if (INVALID_PATH_SEGMENT_CHARACTERS.test(value)) return false;
  const hasControlCharacters = [...value].some(
    (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
  );
  if (hasControlCharacters) return false;
  if (WINDOWS_RESERVED_PATH_SEGMENT.test(value)) return false;
  if (path.isAbsolute(value) || path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) {
    return false;
  }
  return path.basename(value) === value && path.win32.basename(value) === value;
};

const workspacePatterns = (workspaces: unknown): string[] => {
  if (Array.isArray(workspaces)) {
    return workspaces.filter((pattern): pattern is string => typeof pattern === 'string');
  }
  if (workspaces && typeof workspaces === 'object' && 'packages' in workspaces) {
    const packages = (workspaces as { packages?: unknown }).packages;
    if (Array.isArray(packages)) {
      return packages.filter((pattern): pattern is string => typeof pattern === 'string');
    }
  }
  return [];
};

const isBunWorkspaceManifest = (manifest: PackageManifest): boolean => {
  const patterns = workspacePatterns(manifest.workspaces);
  return patterns.includes('apps/*') && patterns.includes('packages/*');
};

export const findBunWorkspaceRoot = async (cwd: string): Promise<string | undefined> => {
  let current = path.resolve(cwd);

  while (true) {
    const manifestPath = path.join(current, 'package.json');
    if (await fs.pathExists(manifestPath)) {
      let parsedManifest: unknown;
      try {
        parsedManifest = await fs.readJson(manifestPath);
      } catch (error) {
        throw new Error(`Unable to read package manifest "${manifestPath}": ${errorMessage(error)}`);
      }
      if (!parsedManifest || typeof parsedManifest !== 'object' || Array.isArray(parsedManifest)) {
        throw new Error(`Invalid package manifest "${manifestPath}": expected a JSON object.`);
      }

      const manifest = parsedManifest as PackageManifest;
      if (isBunWorkspaceManifest(manifest)) return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
};

const workspaceChoices = (location?: WorkspaceLocation): string =>
  formatWorkspaceTemplateChoices(location);

export const findBunWorkspaceContext = async (
  cwd: string
): Promise<BunWorkspaceContext | undefined> => {
  const root = await findBunWorkspaceRoot(cwd);
  if (!root) return undefined;

  const relative = path.relative(root, path.resolve(cwd));
  const normalized = relative.split(path.sep).join('/');
  const workspacePath = process.platform === 'win32' ? normalized.toLowerCase() : normalized;

  if (!workspacePath || workspacePath === '.') {
    return { root, location: 'root' };
  }
  if (workspacePath === 'apps') {
    return { root, location: 'apps' };
  }
  if (workspacePath === 'packages') {
    return { root, location: 'packages' };
  }

  throw new Error(
    [
      `Cannot create a project from inside "${cwd}" because it is below a Bun workspace child.`,
      'Run the command from the workspace root, apps/, or packages/ directory.',
      workspaceChoices(),
    ].join('\n')
  );
};

const validOutsideChoices = (): string => `Available templates: ${Object.keys(TEMPLATE_MAP).join(', ')}`;

const unknownTemplateError = (
  alias: string,
  workspace?: BunWorkspaceContext
): Error =>
  new Error(
    [
      `Unknown template alias: "${alias}"`,
      workspace ? workspaceChoices(workspace.location) : validOutsideChoices(),
    ].join('\n')
  );

const assertSafePathSegment = (value: string, label: string): void => {
  if (!isSafePathSegment(value)) {
    throw new Error(`${label} must be a safe single path segment: "${value}"`);
  }
};

const getTemplatePackageName = async (
  alias: string,
  template: TemplateDefinition,
  templatesRoot: string
): Promise<string> => {
  const source = path.join(templatesRoot, template.directory);
  if (!(await fs.pathExists(source))) {
    throw new Error(`Template directory not found: ${source}`);
  }

  const manifestPath = path.join(source, 'package.json');
  if (!(await fs.pathExists(manifestPath))) {
    throw new Error(
      `Cannot infer a project name for package template "${alias}": package.json not found.`
    );
  }

  let parsedManifest: unknown;
  try {
    parsedManifest = await fs.readJson(manifestPath);
  } catch (error) {
    throw new Error(`Unable to read package manifest "${manifestPath}": ${errorMessage(error)}`);
  }
  if (!parsedManifest || typeof parsedManifest !== 'object' || Array.isArray(parsedManifest)) {
    throw new Error(`Invalid package manifest "${manifestPath}": expected a JSON object.`);
  }

  const packageName = (parsedManifest as PackageManifest).name;
  if (typeof packageName !== 'string' || !packageName) {
    throw new Error(
      `Package template "${alias}" must have a non-empty package.json name to default its project name.`
    );
  }
  assertSafePathSegment(packageName, 'Default package name');
  return packageName;
};

const copyTemplate = async (src: string, dest: string): Promise<void> => {
  await fs.copy(src, dest, {
    filter: (srcPath) => {
      const base = path.basename(srcPath);
      if (SKIP_DIRS.has(base)) return false;
      if (SKIP_FILES.has(base)) return false;
      return true;
    },
  });
};

const renamePackage = async (projectDir: string, projectName: string): Promise<void> => {
  const pkgPath = path.join(projectDir, 'package.json');
  if (!(await fs.pathExists(pkgPath))) return;
  const pkg = await fs.readJson(pkgPath);
  pkg.name = projectName;
  pkg.version = '0.0.1';
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
};

const createAtPath = async (
  alias: string,
  template: TemplateDefinition,
  name: string,
  destination: string,
  templatesRoot: string
): Promise<CreatedProject> => {
  const source = path.join(templatesRoot, template.directory);
  if (!(await fs.pathExists(source))) {
    throw new Error(`Template directory not found: ${source}`);
  }
  if (await fs.pathExists(destination)) {
    throw new Error(`Destination already exists: ${destination}`);
  }

  await fs.ensureDir(path.dirname(destination));
  await copyTemplate(source, destination);
  await renamePackage(destination, name);

  return {
    alias,
    name,
    templateDirectory: template.directory,
    destination,
  };
};

const workspaceProjectChoices = (): string => {
  const apps = getBunTemplateAliases('app');
  const packages = getBunTemplateAliases('package');
  return [
    'Valid --projects choices:',
    `  apps: ${apps.join(', ')}`,
    `  packages: ${packages.join(', ')}`,
  ].join('\n');
};

export interface WorkspaceProjectEntry {
  template: string;
  folder: string;
}

export const parseWorkspaceProjectEntry = (entry: string): WorkspaceProjectEntry => {
  const separator = entry.indexOf('=');
  if (separator < 0) {
    return { template: entry, folder: entry };
  }
  if (entry.indexOf('=', separator + 1) >= 0) {
    throw new Error('use template[=folder] with at most one "="');
  }

  return {
    template: entry.slice(0, separator),
    folder: entry.slice(separator + 1),
  };
};

const isWorkspaceComponent = (
  alias: string,
  template: TemplateDefinition
): template is TemplateDefinition & { kind: 'app' | 'package' } =>
  alias.startsWith('bun-') && (template.kind === 'app' || template.kind === 'package');

const createWorkspaceRoot = async (
  projectName: string,
  template: TemplateDefinition,
  projects: string[],
  cwd: string,
  templatesRoot: string
): Promise<CreateProjectResult> => {
  const root = path.join(cwd, projectName);
  const rootProject = await createAtPath('bun-mono', template, projectName, root, templatesRoot);
  const created = [rootProject];
  const failures: string[] = [];

  for (const entry of projects) {
    try {
      const { template: alias, folder: folderOverride } = parseWorkspaceProjectEntry(entry);
      const component = getTemplateDefinition(alias);
      if (!component) {
        throw new Error(`Unknown template alias: "${alias}"`);
      }
      if (!isWorkspaceComponent(alias, component)) {
        if (component.kind === 'workspace') {
          throw new Error(`"${alias}" is a workspace root template and cannot be a project.`);
        }
        throw new Error(`"${alias}" is not a Bun app or package template.`);
      }
      const folder =
        component.kind === 'package' && !entry.includes('=')
          ? await getTemplatePackageName(alias, component, templatesRoot)
          : folderOverride;
      assertSafePathSegment(folder, 'Project folder');

      const parent = component.kind === 'app' ? 'apps' : 'packages';
      const destination = path.join(root, parent, folder);
      created.push(await createAtPath(alias, component, folder, destination, templatesRoot));
    } catch (error) {
      failures.push(`${JSON.stringify(entry)}: ${errorMessage(error)}`);
    }
  }

  return {
    cwd,
    created,
    failures,
    installRoot: root,
    installCommand: 'bun install',
    validProjectChoices: workspaceProjectChoices(),
  };
};

const createInWorkspace = async (
  projectName: string,
  alias: string,
  template: TemplateDefinition | undefined,
  projects: string[] | undefined,
  workspace: BunWorkspaceContext,
  cwd: string,
  templatesRoot: string
): Promise<CreateProjectResult> => {
  if (projects !== undefined) {
    throw new Error(
      [
        '--projects is only valid when creating a new bun-mono workspace root.',
        workspaceChoices(workspace.location),
      ].join('\n')
    );
  }
  if (!template) throw unknownTemplateError(alias, workspace);
  if (!alias.startsWith('bun-') || !template.kind) {
    throw new Error(
      [
        `Template "${alias}" is standalone-only and cannot be created in a Bun workspace.`,
        workspaceChoices(workspace.location),
      ].join('\n')
    );
  }
  if (template.kind === 'workspace') {
    throw new Error(
      [
        `"${alias}" creates a workspace root and cannot be added inside another Bun workspace.`,
        workspaceChoices(workspace.location),
      ].join('\n')
    );
  }
  if (template.kind !== 'app' && template.kind !== 'package') {
    throw new Error(
      [
        `Template "${alias}" is not a Bun app or package template.`,
        workspaceChoices(workspace.location),
      ].join('\n')
    );
  }
  if (workspace.location === 'apps' && template.kind !== 'app') {
    throw new Error(
      [
        `Template "${alias}" is a ${template.kind} template; apps/ accepts app templates only.`,
        workspaceChoices('apps'),
      ].join('\n')
    );
  }
  if (workspace.location === 'packages' && template.kind !== 'package') {
    throw new Error(
      [
        `Template "${alias}" is an ${template.kind} template; packages/ accepts package templates only.`,
        workspaceChoices('packages'),
      ].join('\n')
    );
  }

  const destination =
    workspace.location === 'root'
      ? path.join(workspace.root, template.kind === 'app' ? 'apps' : 'packages', projectName)
      : path.join(cwd, projectName);

  const created = await createAtPath(alias, template, projectName, destination, templatesRoot);
  return {
    cwd,
    created: [created],
    failures: [],
    installRoot: workspace.root,
    installCommand: 'bun install',
  };
};

export const createProject = async (
  projectName: string | undefined,
  options: CreateProjectOptions
): Promise<CreateProjectResult> => {
  if (projectName !== undefined) {
    assertSafePathSegment(projectName, 'Project name');
  }

  const cwd = path.resolve(options.cwd ?? process.cwd());
  const templatesRoot = path.resolve(options.templatesRoot ?? TEMPLATES_ROOT);
  const workspace = await findBunWorkspaceContext(cwd);
  const template = getTemplateDefinition(options.template);
  if (!template) throw unknownTemplateError(options.template, workspace);

  const resolvedProjectName =
    projectName ??
    (template.kind === 'package'
      ? await getTemplatePackageName(options.template, template, templatesRoot)
      : undefined);
  if (resolvedProjectName === undefined) {
    throw new Error(`Project name is required for template "${options.template}".`);
  }
  assertSafePathSegment(resolvedProjectName, 'Project name');

  if (workspace) {
    return createInWorkspace(
      resolvedProjectName,
      options.template,
      template,
      options.projects,
      workspace,
      cwd,
      templatesRoot
    );
  }

  if (template.kind === 'workspace') {
    if (options.template !== 'bun-mono') {
      throw new Error(`"${options.template}" is not a supported workspace root template.`);
    }
    return createWorkspaceRoot(
      resolvedProjectName,
      template,
      options.projects ?? [],
      cwd,
      templatesRoot
    );
  }

  if (options.projects !== undefined) {
    throw new Error(
      [
        '--projects is only valid with --template bun-mono.',
        workspaceProjectChoices(),
      ].join('\n')
    );
  }

  const destination = path.join(cwd, resolvedProjectName);
  const created = await createAtPath(
    options.template,
    template,
    resolvedProjectName,
    destination,
    templatesRoot
  );
  const isBunTemplate = options.template.startsWith('bun-');

  return {
    cwd,
    created: [created],
    failures: [],
    installRoot: destination,
    installCommand: isBunTemplate ? 'bun install' : 'yarn install',
  };
};
