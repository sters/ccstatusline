import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readStdin } from '../stdin';
import { EventEmitter } from 'events';

describe('readStdin', () => {
  let stdinMock: EventEmitter;
  let originalOn: typeof process.stdin.on;

  beforeEach(() => {
    vi.useFakeTimers();
    stdinMock = new EventEmitter();
    originalOn = process.stdin.on;

    process.stdin.on = vi.fn((event: string, handler: any) => {
      stdinMock.on(event, handler);
      return process.stdin;
    }) as any;
  });

  afterEach(() => {
    process.stdin.on = originalOn;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should read data from stdin', async () => {
    const promise = readStdin();

    stdinMock.emit('data', Buffer.from('{"test": "data"}'));
    stdinMock.emit('end');

    const result = await promise;
    expect(result).toBe('{"test": "data"}');
  });

  it('should handle multiple chunks', async () => {
    const promise = readStdin();

    stdinMock.emit('data', Buffer.from('{"test"'));
    stdinMock.emit('data', Buffer.from(': "data'));
    stdinMock.emit('data', Buffer.from('"}'));
    stdinMock.emit('end');

    const result = await promise;
    expect(result).toBe('{"test": "data"}');
  });

  it('should return empty object string after timeout with no data', async () => {
    const promise = readStdin();

    vi.advanceTimersByTime(101);

    const result = await promise;
    expect(result).toBe('{}');
  });

  it('should handle empty stdin', async () => {
    const promise = readStdin();

    stdinMock.emit('end');

    const result = await promise;
    expect(result).toBe('');
  });

  it('should handle binary data correctly', async () => {
    const promise = readStdin();

    const buffer = Buffer.from('{"binary": "data"}', 'utf-8');
    stdinMock.emit('data', buffer);
    stdinMock.emit('end');

    const result = await promise;
    expect(result).toBe('{"binary": "data"}');
  });

  it('should handle large data', async () => {
    const promise = readStdin();

    const largeData = { data: 'x'.repeat(10000) };
    stdinMock.emit('data', Buffer.from(JSON.stringify(largeData)));
    stdinMock.emit('end');

    const result = await promise;
    expect(JSON.parse(result)).toEqual(largeData);
  });
});