import { describe, expect, it } from 'vitest';
import {
  catalogEntriesFromApi,
  getCatalogEntry,
  getUnifiedTypesInPanelOrder,
  isKnownPanelId,
  panelIdToUnifiedType,
  parseLayoutParam,
  serializeLayoutParam,
  unifiedTypeToPanelId,
} from './dashboardCatalog';

describe('dashboardCatalog layout helpers', () => {
  it('parses and serializes v1 layout params', () => {
    const order = ['power-vi', 'teros', 'u:co2'];
    const serialized = serializeLayoutParam(order);
    expect(serialized).toBe('v1:vi,vwc,co2');
    expect(parseLayoutParam(serialized)).toEqual(order);
  });

  it('rejects unknown panel ids in layout param', () => {
    expect(parseLayoutParam('v1:power-vi,not-a-panel')).toEqual(['power-vi']);
    expect(parseLayoutParam('bad-format')).toEqual([]);
    expect(parseLayoutParam(null)).toEqual([]);
  });

  it('parses presHum and related unified panels from short layout tokens', () => {
    expect(parseLayoutParam('v1:presHum,bme280Pressure,temperature')).toEqual([
      'u:presHum',
      'u:bme280Pressure',
      'u:temperature',
    ]);
    expect(serializeLayoutParam(['u:presHum', 'u:temperature'])).toBe('v1:presHum,temperature');
  });

  it('returns null when serializing empty or invalid panel order', () => {
    expect(serializeLayoutParam([])).toBeNull();
    expect(serializeLayoutParam(['unknown-panel'])).toBeNull();
  });
});

describe('dashboardCatalog panel id helpers', () => {
  it('recognizes known builtin and unified panel ids', () => {
    expect(isKnownPanelId('power-vi')).toBe(true);
    expect(isKnownPanelId('u:co2')).toBe(true);
    expect(isKnownPanelId('missing')).toBe(false);
  });

  it('maps unified types to panel ids and back', () => {
    expect(unifiedTypeToPanelId('co2')).toBe('u:co2');
    expect(panelIdToUnifiedType('u:co2')).toBe('co2');
    expect(panelIdToUnifiedType('power-vi')).toBeNull();
  });

  it('returns catalog entry metadata', () => {
    const entry = getCatalogEntry('power-vi');
    expect(entry?.label).toBe('Voltage & Current');
    expect(getCatalogEntry('does-not-exist')).toBeUndefined();
  });

  it('extracts unified types from panel order', () => {
    expect(getUnifiedTypesInPanelOrder(['power-vi', 'u:co2', 'teros'])).toEqual(['co2']);
  });
});

describe('catalogEntriesFromApi', () => {
  it('merges API rows with static catalog metadata', () => {
    const entries = catalogEntriesFromApi([
      {
        panel_id: 'u:co2',
        label: 'Custom CO₂ label',
        description: 'custom desc',
        category: 'generic',
        kind: 'unified',
      },
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].panelId).toBe('u:co2');
    expect(entries[0].label).toBe('Custom CO₂ label');
    expect(entries[0].unifiedType).toBe('co2');
  });

  it('falls back to full catalog for non-array input', () => {
    expect(catalogEntriesFromApi(null).length).toBeGreaterThan(4);
  });
});
