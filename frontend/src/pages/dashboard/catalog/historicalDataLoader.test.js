import { describe, expect, it } from 'vitest';
import {
  collectEquationRefsFromPanelOrder,
  collectEquationSensorRequests,
  collectUnifiedSensorRequests,
  panelOrderNeedsPower,
  panelOrderNeedsTeros,
  sensorDataCacheKey,
} from './historicalDataLoader';

describe('historicalDataLoader', () => {
  it('detects power and teros panel needs', () => {
    expect(panelOrderNeedsPower(['power-vi', 'teros'])).toBe(true);
    expect(panelOrderNeedsPower(['teros', 'temp'])).toBe(false);
    expect(panelOrderNeedsTeros(['teros', 'power-p'])).toBe(true);
    expect(panelOrderNeedsTeros(['power-vi', 'u:co2'])).toBe(false);
  });

  it('detects teros needs from derived equation panels', () => {
    expect(panelOrderNeedsTeros(['1:vwc / 1:temp'])).toBe(true);
    expect(panelOrderNeedsPower(['1:voltage * 2'])).toBe(true);
  });

  it('collects stream refs from derived layout entries', () => {
    expect(collectEquationRefsFromPanelOrder(['teros', '1:vwc / 2:temp'])).toEqual([
      '1:vwc',
      '2:temp',
    ]);
  });

  it('dedupes unified sensor requests across panels and cells', () => {
    const requests = collectUnifiedSensorRequests(
      ['u:co2', 'u:presHum'],
      [{ id: 1 }, { id: 2 }],
      {
        1: [
          { name: 'co2', measurement: 'co2' },
          { name: 'bme280', measurement: 'pressure' },
          { name: 'bme280', measurement: 'humidity' },
        ],
        2: [{ name: 'co2', measurement: 'co2' }],
      },
    );

    const keys = requests.map((request) => request.cacheKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain(sensorDataCacheKey(1, 'co2', 'co2'));
    expect(keys).toContain(sensorDataCacheKey(1, 'bme280', 'pressure'));
    expect(keys).toContain(sensorDataCacheKey(1, 'bme280', 'humidity'));
    expect(keys).toContain(sensorDataCacheKey(2, 'co2', 'co2'));
  });

  it('collects equation sensor refs for derived panels', () => {
    const requests = collectEquationSensorRequests(['1:co2 * 2']);
    expect(requests).toHaveLength(1);
    expect(requests[0].cacheKey).toBe(sensorDataCacheKey(1, 'co2', 'co2'));
  });
});
