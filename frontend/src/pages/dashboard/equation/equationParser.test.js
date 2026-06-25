import { describe, expect, it } from 'vitest';
import {
  evaluateEquationAt,
  extractCellStreamRefs,
  isDerivedLayoutEntry,
  validateEquationExpression,
} from './equationParser';

describe('equationParser', () => {
  it('validateEquationExpression accepts power operator', () => {
    expect(validateEquationExpression('1:vwc ^ 2')).toBeNull();
  });

  it('validateEquationExpression requires input', () => {
    expect(validateEquationExpression('   ')).toMatch(/required/i);
  });

  it('isDerivedLayoutEntry mirrors validation', () => {
    expect(isDerivedLayoutEntry('1:vwc / 1:temp')).toBe(true);
    expect(isDerivedLayoutEntry('not valid')).toBe(false);
  });

  it('extractCellStreamRefs finds tokens', () => {
    expect(extractCellStreamRefs('1:vwc + 2:bme280')).toEqual(['1:vwc', '2:bme280']);
  });

  it('extractCellStreamRefs rejects unknown streams', () => {
    expect(() => extractCellStreamRefs('1:not_a_stream')).toThrow(/Unknown sensor stream/i);
  });

  it('evaluateEquationAt computes arithmetic', () => {
    const env = { '1:vwc': 10, '1:temp': 2 };
    expect(evaluateEquationAt('1:vwc / 1:temp', env)).toBe(5);
    expect(evaluateEquationAt('1:vwc ^ 2', { '1:vwc': 3 })).toBe(9);
    expect(evaluateEquationAt('1:pressure - 1013', { '1:pressure': 1020 })).toBe(7);
  });

  it('evaluateEquationAt returns null for divide by zero', () => {
    expect(evaluateEquationAt('1:vwc / 1:temp', { '1:vwc': 1, '1:temp': 0 })).toBeNull();
  });

  it('validateEquationExpression rejects bare identifiers', () => {
    expect(validateEquationExpression('vwc / temp')).toMatch(/cell:stream/i);
  });

  it('validateEquationExpression accepts parentheses', () => {
    expect(validateEquationExpression('(1:vwc + 2) * 1:temp')).toBeNull();
  });

  it('validateEquationExpression rejects unknown stream tokens', () => {
    expect(validateEquationExpression('1:missing_stream')).toMatch(/Unknown sensor stream/i);
  });
});
