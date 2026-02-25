import { describe, expect, it } from 'vitest';
import {
  extractUnifiedStreamValue,
  matchesSensorStreamType,
  normalizeUnifiedStreamValue,
} from './unifiedChartUtils';

describe('matchesSensorStreamType', () => {
  it('matches exact type names', () => {
    expect(matchesSensorStreamType('bme280', 'bme280')).toBe(true);
  });

  it('matches typed power stream events to POWER_* chart configs', () => {
    expect(matchesSensorStreamType('power', 'POWER_VOLTAGE')).toBe(true);
    expect(matchesSensorStreamType('power', 'POWER_CURRENT')).toBe(true);
  });

  it('matches typed teros stream events to TEROS12_* chart configs', () => {
    expect(matchesSensorStreamType('teros12', 'TEROS12_VWC')).toBe(true);
    expect(matchesSensorStreamType('teros12', 'TEROS12_VWC_ADJ')).toBe(true);
  });
});

describe('extractUnifiedStreamValue', () => {
  it('extracts adjusted VWC from vwcAdj alias', () => {
    const value = extractUnifiedStreamValue('TEROS12_VWC_ADJ', 'Volumetric Water Content', {
      vwcAdj: 0.42,
    });
    expect(value).toBe(0.42);
  });

  it('extracts raw VWC from vwcRaw alias', () => {
    const value = extractUnifiedStreamValue('TEROS12_VWC', 'Volumetric Water Content', {
      vwcRaw: 1234,
    });
    expect(value).toBe(1234);
  });

  it('extracts raw VWC from SensorVersion2 raw measurement name', () => {
    const value = extractUnifiedStreamValue('TEROS12_VWC', 'Volumetric Water Content (Raw)', {
      'Volumetric Water Content (Raw)': 2145.8,
    });
    expect(value).toBe(2145.8);
  });

  it('extracts CO2 from legacy uppercase key', () => {
    const value = extractUnifiedStreamValue('co2', 'co2', {
      CO2: 800,
    });
    expect(value).toBe(800);
  });
});

describe('normalizeUnifiedStreamValue', () => {
  it('converts adjusted fraction VWC to percent', () => {
    const normalized = normalizeUnifiedStreamValue('TEROS12_VWC_ADJ', 'Volumetric Water Content', 0.42);
    expect(normalized).toBe(42);
  });

  it('converts adjusted boundary value 1.0 to 100', () => {
    const normalized = normalizeUnifiedStreamValue('TEROS12_VWC_ADJ', 'Volumetric Water Content', 1);
    expect(normalized).toBe(100);
  });

  it('does not double-scale adjusted percent VWC', () => {
    const normalized = normalizeUnifiedStreamValue('TEROS12_VWC_ADJ', 'Volumetric Water Content', 42);
    expect(normalized).toBe(42);
  });

  it('returns null for non-finite adjusted VWC values', () => {
    const normalized = normalizeUnifiedStreamValue('TEROS12_VWC_ADJ', 'Volumetric Water Content', Number.NaN);
    expect(normalized).toBeNull();
  });
});
