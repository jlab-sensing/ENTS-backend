import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateTime } from 'luxon';
import {
  buildUnifiedChartDataFromCache,
  collectDbSensorPanelRequests,
  collectEquationRefsFromPanelOrder,
  collectEquationSensorRequests,
  collectUnifiedSensorRequests,
  fetchDashboardSensorData,
  findSensorByPanelId,
  panelOrderNeedsPower,
  panelOrderNeedsTeros,
  sensorDataCacheKey,
} from './historicalDataLoader';

vi.mock('../../../services/sensor', () => ({
  getSensorData: vi.fn(),
}));

import { getSensorData } from '../../../services/sensor';

describe('historicalDataLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('finds sensors by s:{id} panel id', () => {
    const cellSensorsById = {
      1: [{ id: 37, name: 'rocketlogger', measurement: 'soil_moisture' }],
      2: [{ id: 12, name: 'co2', measurement: 'co2' }],
    };
    expect(findSensorByPanelId(cellSensorsById, 's:37')).toMatchObject({
      id: 37,
      name: 'rocketlogger',
    });
    expect(findSensorByPanelId(cellSensorsById, 's:999')).toBeUndefined();
    expect(findSensorByPanelId(cellSensorsById, 'u:co2')).toBeNull();
    expect(findSensorByPanelId(null, 's:37')).toBeUndefined();
  });

  it('collects db sensor panel requests only for matching cells', () => {
    const cellSensorsById = {
      1: [{ id: 37, name: 'rocketlogger', measurement: 'soil_moisture' }],
      2: [{ id: 12, name: 'co2', measurement: 'co2' }],
    };

    const requests = collectDbSensorPanelRequests(
      ['s:37', 's:12', 'u:co2', 's:999'],
      [{ id: 1 }, { id: 2 }],
      cellSensorsById,
    );

    expect(requests).toEqual([
      {
        cacheKey: sensorDataCacheKey(1, 'rocketlogger', 'soil_moisture'),
        cellId: 1,
        name: 'rocketlogger',
        measurement: 'soil_moisture',
      },
      {
        cacheKey: sensorDataCacheKey(2, 'co2', 'co2'),
        cellId: 2,
        name: 'co2',
        measurement: 'co2',
      },
    ]);
  });

  it('skips db sensor panels missing name or measurement', () => {
    expect(
      collectDbSensorPanelRequests(['s:1'], [{ id: 1 }], {
        1: [{ id: 1, name: 'orphan' }],
      }),
    ).toEqual([]);
  });

  it('builds unified chart cache rows from a db sensorSpec', () => {
    const cacheKey = sensorDataCacheKey(1, 'rocketlogger', 'soil_moisture');
    const chartData = buildUnifiedChartDataFromCache(
      [{ id: 1, name: 'Cell A' }],
      null,
      {
        1: [{ id: 37, name: 'rocketlogger', measurement: 'soil_moisture' }],
      },
      {
        [cacheKey]: { timestamp: ['Thu, 18 Jun 2026 00:00:00 GMT'], data: [12] },
      },
      { sensor_name: 'rocketlogger', measurements: ['soil_moisture'] },
    );

    expect(chartData[1]).toMatchObject({
      name: 'Cell A',
      soil_moisture: { timestamp: ['Thu, 18 Jun 2026 00:00:00 GMT'], data: [12] },
    });
  });

  it('fetches historical sensor data for s: panels', async () => {
    getSensorData.mockResolvedValue({ timestamp: [], data: [1] });
    const start = DateTime.fromISO('2026-06-01T00:00:00');
    const end = DateTime.fromISO('2026-06-02T00:00:00');

    const result = await fetchDashboardSensorData({
      cells: [{ id: 1, name: 'Cell A' }],
      panelOrder: ['s:37'],
      startDate: start,
      endDate: end,
      cellSensorsById: {
        1: [{ id: 37, name: 'rocketlogger', measurement: 'soil_moisture' }],
      },
    });

    expect(getSensorData).toHaveBeenCalledWith(
      'rocketlogger',
      1,
      'soil_moisture',
      start.toHTTP(),
      end.toHTTP(),
      'hour',
    );
    expect(result.historicalSensorByKey).toHaveProperty(
      sensorDataCacheKey(1, 'rocketlogger', 'soil_moisture'),
    );
  });
});
