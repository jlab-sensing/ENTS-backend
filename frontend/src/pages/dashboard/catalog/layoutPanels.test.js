import { describe, expect, it } from 'vitest';
import {
  parseLayoutEntry,
  parseLayoutParam,
  panelIdToLayoutToken,
  serializeLayoutParam,
  splitLayoutEntries,
} from './layoutPanels';

describe('layoutPanels', () => {
  it('splitLayoutEntries respects parentheses', () => {
    expect(splitLayoutEntries('vwc,(ignored),temp')).toEqual(['vwc', '(ignored)', 'temp']);
  });

  it('parseLayoutEntry maps John short names to panel ids', () => {
    expect(parseLayoutEntry('vwc')).toBe('teros');
    expect(parseLayoutEntry('vi')).toBe('power-vi');
    expect(parseLayoutEntry('co2')).toBe('u:co2');
  });

  it('parseLayoutParam ignores unknown tokens in layout string', () => {
    const raw = 'vwc,temp,1:vwc / 1:temp,2:vwc + 2:bme280';
    expect(parseLayoutParam(raw)).toEqual(['teros', 'temp']);
  });

  it('parseLayoutParam still accepts legacy v1 prefix', () => {
    expect(parseLayoutParam('v1:teros,temp,presHum')).toEqual(['teros', 'temp', 'u:presHum']);
  });

  it('serializeLayoutParam uses v1 prefix and short names', () => {
    const order = ['power-vi', 'teros', 'temp', 'u:presHum'];
    expect(serializeLayoutParam(order)).toBe('v1:vi,vwc,temp,presHum');
  });

  it('round-trips panel layout with v1 and short names', () => {
    const order = ['teros', 'temp', 'u:co2'];
    const serialized = serializeLayoutParam(order);
    expect(serialized).toBe('v1:vwc,temp,co2');
    expect(parseLayoutParam(serialized)).toEqual(order);
  });

  it('panelIdToLayoutToken maps teros to vwc', () => {
    expect(panelIdToLayoutToken('teros')).toBe('vwc');
  });
});
