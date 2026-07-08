import { describe, expect, it } from 'vitest';
import { listEquationStreamKeys, resolveStreamSpec } from './equationStreams';

describe('equationStreams', () => {
  it('resolveStreamSpec is case-insensitive', () => {
    expect(resolveStreamSpec('VWC')?.source).toBe('teros');
    expect(resolveStreamSpec('co2')?.sensorName).toBe('co2');
  });

  it('resolveStreamSpec returns undefined for unknown keys', () => {
    expect(resolveStreamSpec('not_a_real_stream')).toBeUndefined();
  });

  it('listEquationStreamKeys returns sorted keys', () => {
    const keys = listEquationStreamKeys();
    expect(keys.length).toBeGreaterThan(5);
    expect(keys).toEqual([...keys].sort());
    expect(keys).toContain('vwc');
  });
});
