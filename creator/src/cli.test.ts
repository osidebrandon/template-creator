import { createProgram } from './cli.js';

describe('create command options', () => {
  const createCommand = () =>
    createProgram().commands.find((command) => command.name() === 'create');

  it('requires an explicit template and exposes only the agreed options', () => {
    const command = createCommand();
    expect(command).toBeDefined();

    const options = command?.options ?? [];
    const templateOption = options.find((option) => option.long === '--template');
    expect(templateOption?.mandatory).toBe(true);
    expect(templateOption?.defaultValue).toBeUndefined();
    expect(options.some((option) => option.long === '--projects')).toBe(true);

    const optionFlags = options.flatMap((option) => [option.long, option.short]);
    const removedOptions = ['--dir', '-d', '--app', '--package', '--apps', '--packages'];
    for (const removedOption of removedOptions) {
      expect(optionFlags).not.toContain(removedOption);
    }
  });

  it('documents the required template and workspace batch option in help', () => {
    const command = createCommand();
    const help = command?.helpInformation() ?? '';

    expect(help).toContain('--template <template>');
    expect(help).toContain('--projects <projects...>');
    expect(help).not.toContain('--dir');
  });
});
