import { describe, expect, it } from 'vitest';
import {
  evaluateEquationAt,
  extractCellStreamRefs,
  validateEquationExpression,
} from './equationParser';

describe('equationParser', () => {
  it('validateEquationExpression accepts power operator', () => {
    expect(validateEquationExpression('1:vwc ^ 2')).toBeNull();
  });

  it('extractCellStreamRefs finds tokens', () => {
    expect(extractCellStreamRefs('1:vwc + 2:bme280')).toEqual(['1:vwc', '2:bme280']);
  });

  it('evaluateEquationAt computes arithmetic', () => {
    const env = { '1:vwc': 10, '1:temp': 2 };
    expect(evaluateEquationAt('1:vwc / 1:temp', env)).toBe(5);
    expect(evaluateEquationAt('1:vwc ^ 2', { '1:vwc': 3 })).toBe(9);
    expect(evaluateEquationAt('1:pressure - 1013', { '1:pressure': 1020 })).toBe(7);
  });

  it('validateEquationExpression rejects bare identifiers', () => {
    expect(validateEquationExpression('vwc / temp')).toMatch(/cell:stream/i);
  });
});
