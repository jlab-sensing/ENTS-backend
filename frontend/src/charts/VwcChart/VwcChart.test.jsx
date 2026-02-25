import { describe, expect, it } from 'vitest';
import { getVwcAxisBounds } from './vwcAxis';

describe('getVwcAxisBounds', () => {
  it('returns default 0..50 bounds when data is below 50', () => {
    const bounds = getVwcAxisBounds([
      {
        data: [
          { x: 1, y: 31.2 },
          { x: 2, y: 42.8 },
        ],
      },
    ]);

    expect(bounds.min).toBe(0);
    expect(bounds.max).toBe(50);
    expect(bounds.step).toBe(5);
  });

  it('expands max when observed values exceed 50', () => {
    const bounds = getVwcAxisBounds([
      {
        data: [
          { x: 1, y: 49.1 },
          { x: 2, y: 61.4 },
        ],
      },
    ]);

    expect(bounds.min).toBe(0);
    expect(bounds.max).toBe(64);
    expect(bounds.step).toBe(7);
  });

  it('uses default bounds when dataset is empty or invalid', () => {
    const bounds = getVwcAxisBounds([
      {
        data: [
          { x: 1, y: Number.NaN },
          { x: 2, y: null },
        ],
      },
      {
        data: [],
      },
    ]);

    expect(bounds.min).toBe(0);
    expect(bounds.max).toBe(50);
    expect(bounds.step).toBe(5);
  });
});
