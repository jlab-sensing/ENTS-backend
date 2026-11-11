import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateTime } from 'luxon';
import { buildDerivedSeries } from './equationData';
import { collectEquationSensorRequests, fetchDashboardSensorData } from '../catalog/historicalDataLoader';
import { getPowerData } from '../../../services/power';
import { getSensorData } from '../../../services/sensor';

vi.mock('../../../services/power', () => ({ getPowerData: vi.fn() }));
vi.mock('../../../services/sensor', () => ({ getSensorData: vi.fn() }));
const timestamp = ['Thu, 18 Jun 2026 00:00:00 GMT'];
const start = DateTime.fromISO('2026-06-18T00:00:00Z');
const end = start.plus({ hours: 1 });
const sensors = {
  3: [],
  2538: [
    { name: 'POWER_VOLTAGE', measurement: 'Voltage' },
    { name: 'POWER_CURRENT', measurement: 'Current' },
  ],
};
const historicalSensorByKey = {
  '2538:power_voltage:voltage': { timestamp, data: [12] },
  '2538:power_current:current': { timestamp, data: [2] },
};

describe('generic power history', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getPowerData.mockResolvedValue({ timestamp: [], v: [], i: [], p: [] });
    getSensorData.mockImplementation(async (name) =>
      ({ timestamp, data: name === 'POWER_VOLTAGE' ? [12] : [2] }));
  });

  it.each(['voltage * 2538:current', 'v * 2538:i', 'V * 2538:I'])(
    'resolves generic cached aliases: %s', async (expression) => {
      const result = await buildDerivedSeries(`2538:${expression}`, start, end, 'hour', {
        useCentralCache: true,
        historicalCache: { historicalSensorByKey },
      });
      expect(result?.values).toEqual([24]);
      expect(getPowerData).not.toHaveBeenCalled();
      expect(getSensorData).not.toHaveBeenCalled();
    },
  );

  it('fetches generic data when legacy history is empty', async () => {
    const result = await buildDerivedSeries('2538:v * 2538:i', start, end);
    expect(result?.values).toEqual([24]);
    expect(getSensorData).toHaveBeenCalledWith(
      'POWER_VOLTAGE', 2538, 'Voltage', start.toHTTP(), end.toHTTP(), 'hour',
    );
    expect(getSensorData).toHaveBeenCalledWith(
      'POWER_CURRENT', 2538, 'Current', start.toHTTP(), end.toHTTP(), 'hour',
    );
  });

  it('falls back when legacy timestamps have only null values', async () => {
    getPowerData.mockResolvedValue({ timestamp, v: [null], i: [null] });
    const result = await buildDerivedSeries('2538:v * 2538:i', start, end);
    expect(result?.values).toEqual([24]);
  });

  it('keeps an empty result when a generic operand is unavailable', async () => {
    const result = await buildDerivedSeries('2538:v * 2538:i', start, end, 'hour', {
      useCentralCache: true,
      historicalCache: {
        historicalSensorByKey: {
          '2538:power_voltage:voltage': historicalSensorByKey['2538:power_voltage:voltage'],
        },
      },
    });
    expect(result).toBeNull();
    expect(getSensorData).not.toHaveBeenCalled();
  });

  it('keeps existing legacy data, including zero, without a fallback request', async () => {
    getPowerData.mockResolvedValue({ timestamp, v: [0], i: [3] });
    const result = await buildDerivedSeries('3:v * 3:i', start, end);
    expect(result?.values).toEqual([0]);
    expect(getSensorData).not.toHaveBeenCalled();
  });

  it('preserves legacy precedence when both caches contain data', async () => {
    const result = await buildDerivedSeries('2538:v * 2538:i', start, end, 'hour', {
      useCentralCache: true,
      historicalCache: {
        historicalSensorByKey,
        historicalPowerByCell: { 2538: { powerData: { timestamp, v: [5], i: [3] } } },
      },
    });
    expect(result?.values).toEqual([15]);
  });

  it('does not synthesize a power token from generic sensors', async () => {
    const result = await buildDerivedSeries('2538:p * 2', start, end);
    expect(result).toBeNull();
    expect(getSensorData).not.toHaveBeenCalled();
  });

  it('loads and evaluates a restored equation referencing an unselected cell', async () => {
    const cache = await fetchDashboardSensorData({
      cells: [{ id: 3, name: 'Legacy cell' }],
      panelOrder: ['2538:v * 2538:i'],
      cellSensorsById: { 3: [] },
      startDate: start,
      endDate: end,
    });
    const result = await buildDerivedSeries('2538:v * 2538:i', start, end, 'hour', {
      useCentralCache: true,
      historicalCache: cache,
    });
    expect(result?.values).toEqual([24]);
  });

  it('requests generic history for equation cells without loaded metadata', () => {
    const requests = collectEquationSensorRequests(['99:v * 99:i'], sensors);
    expect(requests.map((request) => request.cacheKey).sort()).toEqual([
      '99:power_current:current', '99:power_voltage:voltage',
    ]);
  });

  it('collects generic equation-only requests once per alias and matching cell', () => {
    const requests = collectEquationSensorRequests(
      ['2538:v * 2538:current', '2538:voltage + 2538:i', '3:v * 3:i'], sensors,
    );
    expect(requests.map((request) => request.cacheKey).sort()).toEqual([
      '2538:power_current:current', '2538:power_voltage:voltage',
    ]);
  });
});
