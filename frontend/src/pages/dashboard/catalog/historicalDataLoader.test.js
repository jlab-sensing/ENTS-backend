import { describe, expect, it } from 'vitest';
import {
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
});
