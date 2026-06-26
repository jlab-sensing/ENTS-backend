import { describe, expect, it } from 'vitest';
import {
  isDerivedPanelEntry,
  parseLayoutEntry,
  parseLayoutParam,
  panelIdToLayoutToken,
  serializeLayoutParam,
  splitLayoutEntries,
} from './layoutPanels';

describe('layoutPanels', () => {
  it('splitLayoutEntries respects parentheses', () => {
    expect(splitLayoutEntries('vwc,(1:vwc + 1:temp),temp')).toEqual([
      'vwc',
      '(1:vwc + 1:temp)',
      'temp',
    ]);
  });

  it('parseLayoutEntry maps John short names to panel ids', () => {
    expect(parseLayoutEntry('vwc')).toBe('teros');
    expect(parseLayoutEntry('vi')).toBe('power-vi');
    expect(parseLayoutEntry('co2')).toBe('u:co2');
  });

  it('parseLayoutParam accepts layout with derived expressions', () => {
    const raw = 'vwc,temp,1:vwc / 1:temp,2:vwc + 2:bme280';
    expect(parseLayoutParam(raw)).toEqual([
      'teros',
      'temp',
      '1:vwc / 1:temp',
      '2:vwc + 2:bme280',
    ]);
  });

  it('parseLayoutParam still accepts legacy v1 prefix', () => {
    expect(parseLayoutParam('v1:teros,temp,1:co2 * 2')).toEqual(['teros', 'temp', '1:co2 * 2']);
    expect(parseLayoutParam('v1:teros,temp,presHum')).toEqual(['teros', 'temp', 'u:presHum']);
  });

  it('serializeLayoutParam uses v1 prefix and short names', () => {
    const order = ['power-vi', '1:vwc ^ 2', 'teros', 'temp'];
    expect(serializeLayoutParam(order)).toBe('v1:vi,1:vwc ^ 2,vwc,temp');

    const catalogOrder = ['power-vi', 'teros', 'temp', 'u:presHum'];
    expect(serializeLayoutParam(catalogOrder)).toBe('v1:vi,vwc,temp,presHum');
  });

  it('round-trips mixed layout with v1 and short names', () => {
    const order = ['teros', 'temp', '1:vwc / 1:temp'];
    const serialized = serializeLayoutParam(order);
    expect(serialized).toBe('v1:vwc,temp,1:vwc / 1:temp');
    expect(parseLayoutParam(serialized)).toEqual(order);
  });

  it('round-trips catalog panel layout with v1 and short names', () => {
    const order = ['teros', 'temp', 'u:co2'];
    const serialized = serializeLayoutParam(order);
    expect(serialized).toBe('v1:vwc,temp,co2');
    expect(parseLayoutParam(serialized)).toEqual(order);
  });

  it('panelIdToLayoutToken maps teros to vwc', () => {
    expect(panelIdToLayoutToken('teros')).toBe('vwc');
  });

  it('isDerivedPanelEntry detects equations', () => {
    expect(isDerivedPanelEntry('1:vwc / 1:temp')).toBe(true);
    expect(isDerivedPanelEntry('vwc')).toBe(false);
  });
});
