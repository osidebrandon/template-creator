#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { TEMPLATE_MAP, DEFAULT_TEMPLATE } from './templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dist/ lives inside creator/, so go up two levels to reach the workspace root
const TEMPLATES_ROOT = path.resolve(__dirname, '..', '..');

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.yarn']);
const SKIP_FILES = new Set(['yarn.lock', 'yarn-error.log', '.env']);

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

const program = new Command();

program.name('oside').description('Scaffold a new project from a local template').version('0.0.1');

program
  .command('create <projectName>')
  .description('Create a new project from a template')
  .option('-t, --template <template>', 'template alias to use', DEFAULT_TEMPLATE)
  .option('-d, --dir <dir>', 'parent directory to create the project in', process.cwd())
  .action(async (projectName: string, opts: { template: string; dir: string }) => {
    const templateDir = TEMPLATE_MAP[opts.template];
    if (!templateDir) {
      console.error(`Unknown template alias: "${opts.template}"`);
      console.error(`Available: ${Object.keys(TEMPLATE_MAP).join(', ')}`);
      process.exit(1);
    }

    const src = path.join(TEMPLATES_ROOT, templateDir);
    const dest = path.resolve(opts.dir, projectName);

    if (!(await fs.pathExists(src))) {
      console.error(`Template directory not found: ${src}`);
      process.exit(1);
    }

    if (await fs.pathExists(dest)) {
      console.error(`Destination already exists: ${dest}`);
      process.exit(1);
    }

    console.log(`Creating ${projectName} from ${templateDir}...`);
    await copyTemplate(src, dest);
    await renamePackage(dest, projectName);
    console.log(`Done. Next steps:`);
    console.log(`  cd ${path.relative(process.cwd(), dest) || projectName}`);
    console.log(`  yarn install`);
  });

program
  .command('list')
  .description('List available template aliases')
  .action(() => {
    const width = Math.max(...Object.keys(TEMPLATE_MAP).map((k) => k.length));
    for (const [alias, dir] of Object.entries(TEMPLATE_MAP)) {
      console.log(`  ${alias.padEnd(width)}  →  ${dir}`);
    }
  });

program.parse();
