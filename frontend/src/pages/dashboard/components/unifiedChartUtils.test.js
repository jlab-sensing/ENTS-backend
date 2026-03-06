import { describe, expect, it } from 'vitest';
import {
  extractUnifiedStreamValue,
  matchesSensorStreamType,
  normalizeUnifiedStreamValue,
} from './unifiedChartUtils';

// ─── matchesSensorStreamType ─────────────────────────────────────────────────

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

  // ── edge cases ──────────────────────────────────────────────────────────────

  it('returns false when measurementType is empty string', () => {
    expect(matchesSensorStreamType('', 'bme280')).toBe(false);
  });

  it('returns false when sensorName is empty string', () => {
    expect(matchesSensorStreamType('bme280', '')).toBe(false);
  });

  it('returns false for null measurementType', () => {
    expect(matchesSensorStreamType(null, 'bme280')).toBe(false);
  });

  it('returns false for null sensorName', () => {
    expect(matchesSensorStreamType('bme280', null)).toBe(false);
  });

  it('returns false for both null inputs', () => {
    expect(matchesSensorStreamType(null, null)).toBe(false);
  });

  it('matching is case-insensitive — POWER matches POWER_VOLTAGE', () => {
    expect(matchesSensorStreamType('POWER', 'POWER_VOLTAGE')).toBe(true);
  });

  it('matching is case-insensitive — teros12 matches TEROS12_TEMP', () => {
    expect(matchesSensorStreamType('teros12', 'TEROS12_TEMP')).toBe(true);
  });

  it('does not do partial name matching — "bme" does not match "bme280"', () => {
    expect(matchesSensorStreamType('bme', 'bme280')).toBe(false);
  });

  it('does not match unrelated sensor types', () => {
    expect(matchesSensorStreamType('co2', 'bme280')).toBe(false);
    expect(matchesSensorStreamType('teros12', 'co2')).toBe(false);
    expect(matchesSensorStreamType('power', 'teros12')).toBe(false);
  });

  it('returns false when neither sensor name starts with power_ nor teros12_', () => {
    expect(matchesSensorStreamType('co2', 'UNKNOWN_SENSOR')).toBe(false);
  });

  it('matches co2 stream event to co2 chart config', () => {
    expect(matchesSensorStreamType('co2', 'co2')).toBe(true);
  });

  it('matches teros12 stream to teros12_ec', () => {
    expect(matchesSensorStreamType('teros12', 'TEROS12_EC')).toBe(true);
  });
});

// ─── extractUnifiedStreamValue ───────────────────────────────────────────────

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

  // ── power stream ────────────────────────────────────────────────────────────

  it('extracts voltage from POWER_VOLTAGE sensor using voltage key', () => {
    const value = extractUnifiedStreamValue('POWER_VOLTAGE', 'Voltage', { voltage: 3300 });
    expect(value).toBe(3300);
  });

  it('extracts current from POWER_CURRENT sensor using current key', () => {
    const value = extractUnifiedStreamValue('POWER_CURRENT', 'Current', { current: 250 });
    expect(value).toBe(250);
  });

  // ── teros12 stream ──────────────────────────────────────────────────────────

  it('extracts temperature from TEROS12_TEMP using temp key', () => {
    const value = extractUnifiedStreamValue('TEROS12_TEMP', 'Temperature', { temp: 22.5 });
    expect(value).toBe(22.5);
  });

  it('extracts electrical conductivity from TEROS12_EC using ec key', () => {
    const value = extractUnifiedStreamValue('TEROS12_EC', 'Electrical Conductivity', { ec: 0.8 });
    expect(value).toBe(0.8);
  });

  // ── edge cases ──────────────────────────────────────────────────────────────

  it('returns null when measurementData is null', () => {
    expect(extractUnifiedStreamValue('bme280', 'temperature', null)).toBeNull();
  });

  it('returns null when measurementData is a number (not an object)', () => {
    expect(extractUnifiedStreamValue('bme280', 'temperature', 42)).toBeNull();
  });

  it('returns null when measurementData is a string', () => {
    expect(extractUnifiedStreamValue('bme280', 'temperature', 'oops')).toBeNull();
  });

  it('returns null when no alias or key matches', () => {
    const value = extractUnifiedStreamValue('bme280', 'temperature', {
      completelyUnrelatedKey: 99,
    });
    expect(value).toBeNull();
  });

  it('prefers the direct measurementLabel key over aliases', () => {
    // The measurementLabel is checked first before aliases list
    const value = extractUnifiedStreamValue('TEROS12_VWC', 'vwcRaw', {
      vwcRaw: 555,
      'Volumetric Water Content': 999,
    });
    expect(value).toBe(555);
  });

  it('extracts value 0 (zero is a valid measurement)', () => {
    const value = extractUnifiedStreamValue('TEROS12_TEMP', 'Temperature', { Temperature: 0 });
    expect(value).toBe(0);
  });
});

// ─── normalizeUnifiedStreamValue ─────────────────────────────────────────────

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

  // ── non-VWC_ADJ sensors should pass through unchanged ──────────────────────

  it('returns value unchanged for non-TEROS12_VWC_ADJ sensors (co2)', () => {
    expect(normalizeUnifiedStreamValue('co2', 'co2', 800)).toBe(800);
  });

  it('returns value unchanged for TEROS12_VWC (raw, not adjusted)', () => {
    expect(normalizeUnifiedStreamValue('TEROS12_VWC', 'Volumetric Water Content', 0.35)).toBe(0.35);
  });

  it('returns value unchanged for TEROS12_TEMP', () => {
    expect(normalizeUnifiedStreamValue('TEROS12_TEMP', 'Temperature', 22.5)).toBe(22.5);
  });

  it('returns value unchanged for POWER_VOLTAGE', () => {
    expect(normalizeUnifiedStreamValue('POWER_VOLTAGE', 'Voltage', 3300)).toBe(3300);
  });

  it('returns value unchanged for bme280', () => {
    expect(normalizeUnifiedStreamValue('bme280', 'temperature', 25.1)).toBe(25.1);
  });

  it('passes through 0 correctly (not treated as null)', () => {
    expect(normalizeUnifiedStreamValue('co2', 'co2', 0)).toBe(0);
  });

  it('passes through negative values unchanged for non-VWC_ADJ sensor', () => {
    expect(normalizeUnifiedStreamValue('TEROS12_TEMP', 'Temperature', -5.2)).toBe(-5.2);
  });
});
