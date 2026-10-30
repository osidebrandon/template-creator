import { describe, expect, it, spyOn } from 'bun:test';
import { log } from './index';

describe('log', () => {
  it('prints the namespace and message', () => {
    const consoleLog = spyOn(console, 'log').mockImplementation(() => {});
    try {
      log('EXAMPLE', 'Hello world!');
      expect(consoleLog).toHaveBeenCalledWith('[EXAMPLE] Hello world!');
    } finally {
      consoleLog.mockRestore();
    }
  });
});
