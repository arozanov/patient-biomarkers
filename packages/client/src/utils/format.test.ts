import { describe, it, expect } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
  it('formats a UTC midnight Date without timezone shift', () => {
    const d = new Date('1990-05-13T00:00:00.000Z');
    expect(formatDate(d)).toBe('May 13, 1990');
  });

  it('uses UTC even when local timezone would shift the day', () => {
    const d = new Date('2024-01-01T00:00:00.000Z');
    expect(formatDate(d)).toBe('Jan 1, 2024');
  });
});
