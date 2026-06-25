import { getPowerData } from '../../../services/power';
import { getTerosData } from '../../../services/teros';
import { getSensorData } from '../../../services/sensor';
import { CHART_CONFIGS } from '../components/chartConfigs';
import { panelIdToUnifiedType } from './dashboardCatalog';
import { measurementMatches } from '../components/unifiedChartUtils';

export { measurementMatches };

export function sensorDataCacheKey(cellId, sensorName, measurement) {
  return `${cellId}:${sensorName}:${measurement}`.toLowerCase();
}

/**
 * @param {unknown[]} cellSensors
 * @param {{ sensor_name: string, measurements: string[] }} config
 */
export function resolveSensorsToFetch(cellSensors, config) {
  const relevantSensors = (Array.isArray(cellSensors) ? cellSensors : []).filter(
    (sensor) =>
      sensor?.name === config.sensor_name && measurementMatches(sensor?.measurement, config.measurements),
  );

  const seenMeasurements = new Set();
  const uniqueSensors = relevantSensors.filter((sensor) => {
    const key = sensor.measurement.toLowerCase();
    if (seenMeasurements.has(key)) return false;
    seenMeasurements.add(key);
    return true;
  });

  if (uniqueSensors.length > 0) {
    return uniqueSensors;
  }

  return config.measurements.map((meas) => ({ name: config.sensor_name, measurement: meas }));
}

export function panelOrderNeedsPower(panelOrder) {
  return panelOrder.some((panelId) => panelId === 'power-vi' || panelId === 'power-p');
}

export function panelOrderNeedsTeros(panelOrder) {
  return panelOrder.some((panelId) => panelId === 'teros' || panelId === 'temp');
}

/**
 * @param {string[]} panelOrder
 * @param {Array<{ id: string|number }>} cells
 * @param {Record<string, unknown[]>} cellSensorsById
 */
export function collectUnifiedSensorRequests(panelOrder, cells, cellSensorsById) {
  const requests = [];
  const seen = new Set();

  panelOrder.forEach((panelId) => {
    const unifiedType = panelIdToUnifiedType(panelId);
    if (!unifiedType) return;

    const config = CHART_CONFIGS[unifiedType];
    if (!config) return;

    cells.forEach((cell) => {
      const cellId = cell.id;
      const cellSensors = cellSensorsById[String(cellId)];
      const sensorsToFetch = resolveSensorsToFetch(cellSensors, config);

      sensorsToFetch.forEach((sensor) => {
        const cacheKey = sensorDataCacheKey(cellId, sensor.name, sensor.measurement);
        if (seen.has(cacheKey)) return;
        seen.add(cacheKey);
        requests.push({
          cacheKey,
          cellId,
          name: sensor.name,
          measurement: sensor.measurement,
        });
      });
    });
  });

  return requests;
}

/**
 * @param {Array<{ id: string|number, name: string }>} cells
 * @param {string} unifiedType
 * @param {Record<string, unknown[]>} cellSensorsById
 * @param {Record<string, unknown>} historicalSensorByKey
 */
export function buildUnifiedChartDataFromCache(cells, unifiedType, cellSensorsById, historicalSensorByKey) {
  const config = CHART_CONFIGS[unifiedType];
  if (!config) return {};

  const entries = cells.map(({ id, name }) => {
    const sensorsToFetch = resolveSensorsToFetch(cellSensorsById[String(id)], config);
    const measEntries = sensorsToFetch
      .map((sensor) => {
        const cacheKey = sensorDataCacheKey(id, sensor.name, sensor.measurement);
        const payload = historicalSensorByKey[cacheKey];
        return payload ? [sensor.measurement, payload] : null;
      })
      .filter(Boolean);

    return [
      id,
      {
        name,
        ...Object.fromEntries(measEntries),
      },
    ];
  });

  return Object.fromEntries(entries);
}

/**
 * Catalog-gated, deduped historical fetch for dashboard panels.
 * @param {object} params
 * @param {Array<{ id: string|number, name: string }>} params.cells
 * @param {string[]} params.panelOrder
 * @param {import('luxon').DateTime} params.startDate
 * @param {import('luxon').DateTime} params.endDate
 * @param {Record<string, unknown[]>} params.cellSensorsById
 * @param {string} [params.resample]
 */
export async function fetchDashboardHistoricalData({
  cells,
  panelOrder,
  startDate,
  endDate,
  cellSensorsById,
  resample = 'hour',
}) {
  if (!cells.length || !panelOrder.length) {
    return {
      historicalPowerByCell: {},
      historicalTerosByCell: {},
      historicalSensorByKey: {},
    };
  }

  const startHTTP = startDate.toHTTP();
  const endHTTP = endDate.toHTTP();
  const tasks = [];

  if (panelOrderNeedsPower(panelOrder)) {
    tasks.push(
      Promise.all(
        cells.map(async ({ id, name }) => {
          const powerData = await getPowerData(id, startHTTP, endHTTP, resample);
          return [id, { name, powerData }];
        }),
      ).then((entries) => ({ kind: 'power', data: Object.fromEntries(entries) })),
    );
  }

  if (panelOrderNeedsTeros(panelOrder)) {
    tasks.push(
      Promise.all(
        cells.map(async ({ id, name }) => {
          const terosData = await getTerosData(id, startHTTP, endHTTP, resample);
          return [id, { name, terosData }];
        }),
      ).then((entries) => ({ kind: 'teros', data: Object.fromEntries(entries) })),
    );
  }

  const sensorRequests = collectUnifiedSensorRequests(panelOrder, cells, cellSensorsById);
  if (sensorRequests.length > 0) {
    tasks.push(
      Promise.all(
        sensorRequests.map(async ({ cacheKey, cellId, name, measurement }) => {
          const payload = await getSensorData(name, cellId, measurement, startHTTP, endHTTP, resample);
          return [cacheKey, payload];
        }),
      ).then((entries) => ({ kind: 'sensor', data: Object.fromEntries(entries) })),
    );
  }

  const results = await Promise.all(tasks);
  const historicalPowerByCell = {};
  const historicalTerosByCell = {};
  const historicalSensorByKey = {};

  results.forEach((result) => {
    if (result.kind === 'power') {
      Object.assign(historicalPowerByCell, result.data);
    } else if (result.kind === 'teros') {
      Object.assign(historicalTerosByCell, result.data);
    } else if (result.kind === 'sensor') {
      Object.assign(historicalSensorByKey, result.data);
    }
  });

  return { historicalPowerByCell, historicalTerosByCell, historicalSensorByKey };
}

/**
 * Power + TEROS only (does not depend on cell sensor metadata).
 */
export async function fetchDashboardPowerTerosData({
  cells,
  panelOrder,
  startDate,
  endDate,
  resample = 'hour',
}) {
  if (!cells.length || !panelOrder.length) {
    return { historicalPowerByCell: {}, historicalTerosByCell: {} };
  }

  const startHTTP = startDate.toHTTP();
  const endHTTP = endDate.toHTTP();
  const tasks = [];

  if (panelOrderNeedsPower(panelOrder)) {
    tasks.push(
      Promise.all(
        cells.map(async ({ id, name }) => {
          const powerData = await getPowerData(id, startHTTP, endHTTP, resample);
          return [id, { name, powerData }];
        }),
      ).then((entries) => ({ kind: 'power', data: Object.fromEntries(entries) })),
    );
  }

  if (panelOrderNeedsTeros(panelOrder)) {
    tasks.push(
      Promise.all(
        cells.map(async ({ id, name }) => {
          const terosData = await getTerosData(id, startHTTP, endHTTP, resample);
          return [id, { name, terosData }];
        }),
      ).then((entries) => ({ kind: 'teros', data: Object.fromEntries(entries) })),
    );
  }

  const results = await Promise.all(tasks);
  const historicalPowerByCell = {};
  const historicalTerosByCell = {};

  results.forEach((result) => {
    if (result.kind === 'power') {
      Object.assign(historicalPowerByCell, result.data);
    } else if (result.kind === 'teros') {
      Object.assign(historicalTerosByCell, result.data);
    }
  });

  return { historicalPowerByCell, historicalTerosByCell };
}

/**
 * Unified sensor series only (depends on cell sensor metadata).
 */
export async function fetchDashboardSensorData({
  cells,
  panelOrder,
  startDate,
  endDate,
  cellSensorsById,
  resample = 'hour',
}) {
  if (!cells.length || !panelOrder.length) {
    return { historicalSensorByKey: {} };
  }

  const startHTTP = startDate.toHTTP();
  const endHTTP = endDate.toHTTP();
  const sensorRequests = collectUnifiedSensorRequests(panelOrder, cells, cellSensorsById);

  if (sensorRequests.length === 0) {
    return { historicalSensorByKey: {} };
  }

  const entries = await Promise.all(
    sensorRequests.map(async ({ cacheKey, cellId, name, measurement }) => {
      const payload = await getSensorData(name, cellId, measurement, startHTTP, endHTTP, resample);
      return [cacheKey, payload];
    }),
  );

  return { historicalSensorByKey: Object.fromEntries(entries) };
}
