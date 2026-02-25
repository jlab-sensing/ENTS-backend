import { describe, expect, it } from 'vitest';
import { toPercentIfFraction } from './vwcValue';

describe('toPercentIfFraction', () => {
  it('converts fraction values to percent', () => {
    expect(toPercentIfFraction(0.42)).toBe(42);
    expect(toPercentIfFraction(1)).toBe(100);
  });

  it('does not double-scale percentage values', () => {
    expect(toPercentIfFraction(42)).toBe(42);
    expect(toPercentIfFraction(100)).toBe(100);
  });

  it('keeps non-positive values unchanged', () => {
    expect(toPercentIfFraction(0)).toBe(0);
    expect(toPercentIfFraction(-0.4)).toBe(-0.4);
  });

  it('returns null for non-finite input', () => {
    expect(toPercentIfFraction(Number.NaN)).toBeNull();
    expect(toPercentIfFraction(Number.POSITIVE_INFINITY)).toBeNull();
    expect(toPercentIfFraction(null)).toBeNull();
  });
});
