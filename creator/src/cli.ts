import { Command } from 'commander';
import path from 'path';
import { createProject } from './create.js';
import { formatTemplateList } from './templates.js';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const createProgram = (): Command => {
  const program = new Command();

  program.name('oside').description('Scaffold a new project from a local template').version('0.0.1');

  program
    .command('create <projectName>')
    .description('Create a new project from a template')
    .requiredOption('-t, --template <template>', 'template alias to use')
    .option('--projects <projects...>', 'Bun templates to add to a new bun-mono workspace')
    .action(async (projectName: string, options: { template: string; projects?: string[] }) => {
      try {
        const result = await createProject(projectName, options);
        for (const project of result.created) {
          const relativePath = path.relative(result.cwd, project.destination) || '.';
          console.log(`Created ${project.alias} at ${relativePath}`);
        }

        for (const failure of result.failures) {
          console.error(`Failed ${failure}`);
        }
        if (result.failures.length > 0) {
          console.error(result.validProjectChoices);
          process.exitCode = 1;
        }

        console.log('Done. Next steps:');
        const installPath = path.relative(result.cwd, result.installRoot) || '.';
        console.log(`  cd ${installPath}`);
        console.log(`  ${result.installCommand}`);
      } catch (error) {
        console.error(errorMessage(error));
        process.exitCode = 1;
      }
    });

  program
    .command('list')
    .description('List available template aliases')
    .action(() => {
      console.log(formatTemplateList());
    });

  return program;
};
