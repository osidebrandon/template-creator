import { describe, expect, it } from 'bun:test';
import { identity } from './index';

describe('identity', () => {
  it('returns the supplied value', () => {
    expect(identity('value')).toBe('value');
  });
});
