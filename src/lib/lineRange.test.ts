import { describe, it, expect } from 'vitest';
import { parseLineHash, formatLineHash } from './lineRange';

describe('parseLineHash', () => {
  it('parses a single line', () => {
    expect(parseLineHash('#L42')).toEqual([42, 42]);
  });

  it('parses a range', () => {
    expect(parseLineHash('#L3-L9')).toEqual([3, 9]);
  });

  it('normalizes a reversed range', () => {
    expect(parseLineHash('#L9-L3')).toEqual([3, 9]);
  });

  it('rejects line zero', () => {
    expect(parseLineHash('#L0')).toBeNull();
    expect(parseLineHash('#L0-L5')).toBeNull();
  });

  it('rejects malformed hashes', () => {
    expect(parseLineHash('')).toBeNull();
    expect(parseLineHash('#')).toBeNull();
    expect(parseLineHash('#L')).toBeNull();
    expect(parseLineHash('#42')).toBeNull();
    expect(parseLineHash('#L1-2')).toBeNull();
    expect(parseLineHash('#L1-L2-L3')).toBeNull();
    expect(parseLineHash('L1')).toBeNull();
  });
});

describe('formatLineHash', () => {
  it('formats a single line without a range suffix', () => {
    expect(formatLineHash([7, 7])).toBe('L7');
  });

  it('formats a range', () => {
    expect(formatLineHash([3, 9])).toBe('L3-L9');
  });

  it('round-trips through parseLineHash', () => {
    expect(parseLineHash(`#${formatLineHash([12, 34])}`)).toEqual([12, 34]);
    expect(parseLineHash(`#${formatLineHash([5, 5])}`)).toEqual([5, 5]);
  });
});
