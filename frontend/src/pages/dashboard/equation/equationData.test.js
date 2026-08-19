import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DateTime } from 'luxon';
import {
  buildDerivedSeries,
  buildDerivedSeriesFromLiveData,
  derivedSeriesToChartData,
  liveValueForEquationRef,
  streamSeriesFromHistoricalCache,
} from './equationData';

vi.mock('../../../services/power', () => ({
  getPowerData: vi.fn(),
}));

vi.mock('../../../services/teros', () => ({
  getTerosData: vi.fn(),
}));

vi.mock('../../../services/sensor', () => ({
  getSensorData: vi.fn(),
}));

import { getTerosData } from '../../../services/teros';

describe('equationData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads teros stream values from central historical cache', () => {
    const series = streamSeriesFromHistoricalCache(1, 'vwc', {
      historicalTerosByCell: {
        1: {
          terosData: {
            timestamp: ['Thu, 18 Jun 2026 00:00:00 GMT'],
            vwc: [42],
            temp: [20],
          },
        },
      },
    });

    expect(series).toEqual({
      timestamps: [new Date('Thu, 18 Jun 2026 00:00:00 GMT').getTime()],
      values: [42],
    });
  });

  it('reads power stream values from central historical cache', () => {
    const series = streamSeriesFromHistoricalCache(1, 'voltage', {
      historicalPowerByCell: {
        1: {
          powerData: {
            timestamp: ['Thu, 18 Jun 2026 00:00:00 GMT'],
            v: [12],
          },
        },
      },
    });

    expect(series?.values).toEqual([12]);
  });

  it('reads sensor stream values from central historical cache', () => {
    const series = streamSeriesFromHistoricalCache(1, 'co2', {
      historicalSensorByKey: {
        '1:co2:co2': {
          timestamp: ['Thu, 18 Jun 2026 00:00:00 GMT'],
          data: [400],
        },
      },
    });

    expect(series?.values).toEqual([400]);
  });

  it('buildDerivedSeries uses cache instead of fetching when available', async () => {
    const start = DateTime.fromISO('2026-06-01T00:00:00');
    const end = DateTime.fromISO('2026-06-02T00:00:00');
    const ts = new Date('Thu, 18 Jun 2026 00:00:00 GMT').getTime();

    const result = await buildDerivedSeries('1:vwc / 1:temp', start, end, 'hour', {
      useCentralCache: true,
      historicalCache: {
        historicalTerosByCell: {
          1: {
            terosData: {
              timestamp: ['Thu, 18 Jun 2026 00:00:00 GMT'],
              vwc: [20],
              temp: [2],
            },
          },
        },
      },
    });

    expect(getTerosData).not.toHaveBeenCalled();
    expect(result?.values).toEqual([10]);
    expect(result?.timestamps).toEqual([ts]);
  });

  it('buildDerivedSeries fetches when cache is disabled', async () => {
    const start = DateTime.fromISO('2026-06-01T00:00:00');
    const end = DateTime.fromISO('2026-06-02T00:00:00');

    getTerosData.mockResolvedValue({
      timestamp: ['Thu, 18 Jun 2026 00:00:00 GMT'],
      vwc: [6],
      temp: [3],
      ec: [],
    });

    const result = await buildDerivedSeries('1:vwc / 1:temp', start, end, 'hour', {
      useCentralCache: false,
    });

    expect(getTerosData).toHaveBeenCalled();
    expect(result?.values).toEqual([2]);
  });

  it('derivedSeriesToChartData builds chart.js datasets', () => {
    const chart = derivedSeriesToChartData('1:vwc / 1:temp', [1, 2], [10, 20]);
    expect(chart.datasets[0].label).toBe('1:vwc / 1:temp');
    expect(chart.datasets[0].data).toEqual([
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ]);
  });

  it('liveValueForEquationRef reads teros and power fields from websocket packets', () => {
    expect(
      liveValueForEquationRef('3:vwc', {
        type: 'teros12',
        cellId: 3,
        data: { vwcAdj: 0.4, temp: 20 },
      }),
    ).toBe(40);
    expect(
      liveValueForEquationRef('3:temp', {
        type: 'teros12',
        cellId: 3,
        data: { vwcAdj: 0.4, temp: 20 },
      }),
    ).toBe(20);
    expect(
      liveValueForEquationRef('3:voltage', {
        type: 'power',
        cellId: 3,
        data: { voltage: 12, current: 2 },
      }),
    ).toBe(12);
    expect(
      liveValueForEquationRef('3:vwc', {
        type: 'power',
        cellId: 3,
        data: { voltage: 12, current: 2 },
      }),
    ).toBeUndefined();
  });

  it('liveValueForEquationRef reads generic ents packets (SensorType + display-name key)', () => {
    expect(
      liveValueForEquationRef('2:voltage', {
        type: 'POWER_VOLTAGE',
        cellId: 2,
        data: { Voltage: 3300 },
      }),
    ).toBe(3300);
    expect(
      liveValueForEquationRef('2:temperature', {
        type: 'BME280_TEMP',
        cellId: 2,
        data: { Temperature: 21.5 },
      }),
    ).toBe(21.5);
    expect(
      liveValueForEquationRef('2:vwc', {
        type: 'TEROS12_VWC_ADJ',
        cellId: 2,
        data: { 'Volumetric Water Content': 0.4 },
      }),
    ).toBe(40);
  });

  it('liveValueForEquationRef ignores generic packets that cannot satisfy the ref', () => {
    // Wrong measurement within the same sensor family.
    expect(
      liveValueForEquationRef('2:pressure', {
        type: 'BME280_TEMP',
        cellId: 2,
        data: { Temperature: 21.5 },
      }),
    ).toBeUndefined();
    // Power needs voltage and current, which never share one generic packet.
    expect(
      liveValueForEquationRef('2:power', {
        type: 'POWER_VOLTAGE',
        cellId: 2,
        data: { Voltage: 3300 },
      }),
    ).toBeUndefined();
  });

  it('buildDerivedSeriesFromLiveData evaluates once both operands arrive (same packet)', () => {
    const series = buildDerivedSeriesFromLiveData('3:vwc / 3:temp', [
      {
        type: 'teros12',
        cellId: 3,
        timestamp: 1_700_000_000,
        data: { vwcAdj: 0.4, temp: 20, ec: 100 },
      },
    ]);
    expect(series).toEqual({
      timestamps: [1_700_000_000_000],
      values: [2],
    });
  });

  it('buildDerivedSeriesFromLiveData uses latest values across separate packets', () => {
    const series = buildDerivedSeriesFromLiveData('3:voltage / 3:temp', [
      {
        type: 'power',
        cellId: 3,
        timestamp: 100,
        data: { voltage: 12, current: 1 },
      },
      {
        type: 'teros12',
        cellId: 3,
        timestamp: 101,
        data: { vwcAdj: 0.3, temp: 3, ec: 1 },
      },
    ]);
    // First packet alone is incomplete; second packet completes and evaluates 12/3=4
    expect(series).toEqual({
      timestamps: [101_000],
      values: [4],
    });
  });
});
