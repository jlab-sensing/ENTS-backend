import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DateTime } from 'luxon';
import {
  buildDerivedSeries,
  derivedSeriesToChartData,
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
});
