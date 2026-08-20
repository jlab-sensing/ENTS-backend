import { describe, expect, it } from 'vitest';
import {
  isHistoricalCacheReady,
  selectPublishedHistoricalCaches,
} from './useDashboardHistoricalData';

describe('isHistoricalCacheReady', () => {
  it('is false on the first render after resample changes (stale hourly cache)', () => {
    expect(
      isHistoricalCacheReady(
        'none|range|1|power-vi',
        'none|range|1|power-vi|{}',
        'hour|range|1|power-vi',
        'hour|range|1|power-vi|{}',
        false,
        false,
      ),
    ).toBe(false);
  });

  it('is false while either half is still fetching', () => {
    expect(isHistoricalCacheReady('k', 'k|s', 'k', 'k|s', true, false)).toBe(false);
    expect(isHistoricalCacheReady('k', 'k|s', 'k', 'k|s', false, true)).toBe(false);
  });

  it('is false when only the sensor catalog key is stale', () => {
    expect(isHistoricalCacheReady('k', 'k|{new}', 'k', 'k|{old}', false, false)).toBe(false);
  });

  it('is true only when both halves match the requested keys and are idle', () => {
    expect(isHistoricalCacheReady('k', 'k|s', 'k', 'k|s', false, false)).toBe(true);
  });
});

describe('selectPublishedHistoricalCaches', () => {
  it('hides leftover hourly series while a none/day refetch is in flight', () => {
    const published = selectPublishedHistoricalCaches(
      false,
      { 1: { powerData: { v: [1] } } },
      { 1: { terosData: { vwc: [2] } } },
      { '1:co2:co2': { data: [3] } },
    );

    expect(published).toEqual({
      historicalPowerByCell: {},
      historicalTerosByCell: {},
      historicalSensorByKey: {},
    });
  });

  it('publishes caches only when they match the requested downsample', () => {
    const power = { 1: { powerData: { v: [1] } } };
    const teros = { 1: { terosData: { vwc: [2] } } };
    const sensors = { '1:co2:co2': { data: [3] } };

    expect(selectPublishedHistoricalCaches(true, power, teros, sensors)).toEqual({
      historicalPowerByCell: power,
      historicalTerosByCell: teros,
      historicalSensorByKey: sensors,
    });
  });
});
