import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateTime } from 'luxon';
import { fetchDashboardPowerTerosData } from '../catalog/historicalDataLoader';
import {
  isHistoricalCacheReady,
  selectPublishedHistoricalCaches,
  useDashboardHistoricalData,
} from './useDashboardHistoricalData';

vi.mock('../catalog/historicalDataLoader', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchDashboardPowerTerosData: vi.fn(() => Promise.resolve({ historicalPowerByCell: {}, historicalTerosByCell: {} })),
  fetchDashboardSensorData: vi.fn(() => Promise.resolve({ historicalSensorByKey: {} })),
}));

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

describe('useDashboardHistoricalData', () => {
  const baseOptions = {
    panelOrder: ['power-vi'],
    startDate: DateTime.fromISO('2026-01-01T00:00:00Z'),
    endDate: DateTime.fromISO('2026-01-14T00:00:00Z'),
    cellSensorsById: {},
    resample: 'hour',
  };
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderUseDashboardHistoricalData = (options) => {
    const props = { ...baseOptions, ...options };
    return renderHook(() => useDashboardHistoricalData(props));
  };

  it('reports loading until the selected cells have been fetched', async () => {
    const { result } = renderUseDashboardHistoricalData({
      cells: [{ id: 1, name: 'Cell A' }],
      stream: false,
      enabled: true,
    });
    expect(result.current.historicalLoading).toBe(true);
    await waitFor(() => expect(result.current.historicalLoading).toBe(false));
    expect(fetchDashboardPowerTerosData).toHaveBeenCalledTimes(1);
  });

  it('keeps reporting loading while cells are selected but fetching is not enabled yet', () => {
    const { result } = renderUseDashboardHistoricalData({
      cells: [{ id: 1, name: 'Cell A' }],
      stream: false,
      enabled: false,
    });
    expect(result.current.historicalLoading).toBe(true);
    expect(fetchDashboardPowerTerosData).not.toHaveBeenCalled();
  });

  it.each([
    ['no cells are selected', { cells: [], stream: false, enabled: false }],
    ['streaming', { cells: [{ id: 1, name: 'Cell A' }], stream: true, enabled: true }],
  ])('does not report loading while %s', (_, options) => {
    const { result } = renderUseDashboardHistoricalData(options);
    expect(result.current.historicalLoading).toBe(false);
    expect(fetchDashboardPowerTerosData).not.toHaveBeenCalled();
  });
});
