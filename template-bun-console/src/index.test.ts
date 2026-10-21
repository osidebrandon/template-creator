import { describe, expect, it } from 'bun:test';
import { greet } from './index';

describe('greet', () => {
  it('greets the supplied name', () => {
    expect(greet('Alice')).toBe('Hello, Alice!');
  });
});
