import { greet } from 'template-node-package';

describe('template-node-package integration', () => {
  it('greet returns a greeting', () => {
    expect(greet('World')).toBe('Hello, World!');
  });

  it('greet uses the provided name', () => {
    expect(greet('Alice')).toBe('Hello, Alice!');
  });
});
