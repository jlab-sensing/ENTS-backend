import { panelIdToUnifiedType, isSensorPanelEntry, sensorPanelIdToSensorId } from './dashboardCatalog';
import { measurementMatches } from '../components/unifiedChartUtils';
import { extractCellStreamRefs, isDerivedLayoutEntry } from '../equation/equationParser';
import { resolveStreamSpec } from '../equation/equationStreams';
import { CHART_CONFIGS } from '../components/chartConfigs';
import { getPowerData } from '../../../services/power';
import { getTerosData } from '../../../services/teros';
import { getSensorData } from '../../../services/sensor';

export { measurementMatches };

export function sensorDataCacheKey(cellId, sensorName, measurement) {
  return `${cellId}:${sensorName}:${measurement}`.toLowerCase();
}

/**
 * @param {string} panelId
 * @param {Record<string, unknown[]>} cellSensorsById
 */
export function findSensorByPanelId(cellSensorsById, panelId) {
  const sensorId = sensorPanelIdToSensorId(panelId);
  if (sensorId == null) return null;
  return Object.values(cellSensorsById || {})
    .flatMap((sensors) => (Array.isArray(sensors) ? sensors : []))
    .find((sensor) => Number(sensor?.id) === sensorId);
}

/**
 * @param {string} ref - e.g. "2:vwc"
 * @returns {{ cellId: number, streamKey: string } | null}
 */
export function parseCellStreamRef(ref) {
  const match = ref.match(/^(\d+):([a-zA-Z][a-zA-Z0-9_]*)$/);
  if (!match) return null;
  return { cellId: Number(match[1]), streamKey: match[2] };
}

/**
 * @param {string[]} panelOrder
 * @returns {string[]}
 */
export function collectEquationRefsFromPanelOrder(panelOrder) {
  const refs = new Set();
  panelOrder.forEach((entry) => {
    if (!isDerivedLayoutEntry(entry)) return;
    try {
      extractCellStreamRefs(entry).forEach((ref) => refs.add(ref));
    } catch {
      // ignore invalid derived entries already in layout
    }
  });
  return [...refs];
}

/**
 * @param {Array<{ id: string|number, name?: string }>} cells
 * @param {string[]} panelOrder
 * @returns {Array<{ id: string|number, name: string }>}
 */
export function cellsForHistoricalFetch(cells, panelOrder) {
  const byId = new Map(
    cells.map((cell) => [String(cell.id), { id: cell.id, name: cell.name ?? `Cell-${cell.id}` }]),
  );

  collectEquationRefsFromPanelOrder(panelOrder).forEach((ref) => {
    const parsed = parseCellStreamRef(ref);
    if (!parsed) return;
    const key = String(parsed.cellId);
    if (!byId.has(key)) {
      byId.set(key, { id: parsed.cellId, name: `Cell-${parsed.cellId}` });
    }
  });

  return [...byId.values()];
}

function equationRefsNeedSource(panelOrder, source) {
  return collectEquationRefsFromPanelOrder(panelOrder).some((ref) => {
    const parsed = parseCellStreamRef(ref);
    const spec = parsed && resolveStreamSpec(parsed.streamKey);
    return spec?.source === source;
  });
}

/**
 * @param {string[]} panelOrder
 */
export function collectEquationSensorRequests(panelOrder) {
  const requests = [];
  const seen = new Set();

  collectEquationRefsFromPanelOrder(panelOrder).forEach((ref) => {
    const parsed = parseCellStreamRef(ref);
    const spec = parsed && resolveStreamSpec(parsed.streamKey);
    if (!spec || spec.source !== 'sensor') return;

    const cacheKey = sensorDataCacheKey(parsed.cellId, spec.sensorName, spec.measurement);
    if (seen.has(cacheKey)) return;
    seen.add(cacheKey);
    requests.push({
      cacheKey,
      cellId: parsed.cellId,
      name: spec.sensorName,
      measurement: spec.measurement,
    });
  });

  return requests;
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
  if (panelOrder.some((panelId) => panelId === 'power-vi' || panelId === 'power-p')) {
    return true;
  }
  return equationRefsNeedSource(panelOrder, 'power');
}

export function panelOrderNeedsTeros(panelOrder) {
  if (panelOrder.some((panelId) => panelId === 'teros' || panelId === 'temp')) {
    return true;
  }
  return equationRefsNeedSource(panelOrder, 'teros');
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
 * @param {string[]} panelOrder
 * @param {Array<{ id: string|number }>} cells
 * @param {Record<string, unknown[]>} cellSensorsById
 */
export function collectDbSensorPanelRequests(panelOrder, cells, cellSensorsById) {
  const requests = [];
  const seen = new Set();

  panelOrder.forEach((panelId) => {
    if (!isSensorPanelEntry(panelId)) return;
    const sensor = findSensorByPanelId(cellSensorsById, panelId);
    if (!sensor?.name || !sensor?.measurement) return;

    cells.forEach((cell) => {
      const cellSensors = cellSensorsById[String(cell.id)] || [];
      if (!cellSensors.some((row) => Number(row?.id) === Number(sensor.id))) return;

      const cacheKey = sensorDataCacheKey(cell.id, sensor.name, sensor.measurement);
      if (seen.has(cacheKey)) return;
      seen.add(cacheKey);
      requests.push({
        cacheKey,
        cellId: cell.id,
        name: sensor.name,
        measurement: sensor.measurement,
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
 * @param {{ sensor_name: string, measurements: string[] } | null} [sensorSpec]
 */
export function buildUnifiedChartDataFromCache(
  cells,
  unifiedType,
  cellSensorsById,
  historicalSensorByKey,
  sensorSpec = null,
) {
  const config = sensorSpec
    ? {
        sensor_name: sensorSpec.sensor_name,
        measurements: sensorSpec.measurements,
      }
    : CHART_CONFIGS[unifiedType];
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

  const fetchCells = cellsForHistoricalFetch(cells, panelOrder);
  const startHTTP = startDate.toHTTP();
  const endHTTP = endDate.toHTTP();
  const tasks = [];

  if (panelOrderNeedsPower(panelOrder)) {
    tasks.push(
      Promise.all(
        fetchCells.map(async ({ id, name }) => {
          const powerData = await getPowerData(id, startHTTP, endHTTP, resample);
          return [id, { name, powerData }];
        }),
      ).then((entries) => ({ kind: 'power', data: Object.fromEntries(entries) })),
    );
  }

  if (panelOrderNeedsTeros(panelOrder)) {
    tasks.push(
      Promise.all(
        fetchCells.map(async ({ id, name }) => {
          const terosData = await getTerosData(id, startHTTP, endHTTP, resample);
          return [id, { name, terosData }];
        }),
      ).then((entries) => ({ kind: 'teros', data: Object.fromEntries(entries) })),
    );
  }

  const sensorRequests = [
    ...collectUnifiedSensorRequests(panelOrder, cells, cellSensorsById),
    ...collectDbSensorPanelRequests(panelOrder, cells, cellSensorsById),
    ...collectEquationSensorRequests(panelOrder),
  ];
  const seen = new Set();
  const dedupedSensorRequests = sensorRequests.filter((request) => {
    if (seen.has(request.cacheKey)) return false;
    seen.add(request.cacheKey);
    return true;
  });
  if (dedupedSensorRequests.length > 0) {
    tasks.push(
      Promise.all(
        dedupedSensorRequests.map(async ({ cacheKey, cellId, name, measurement }) => {
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

  const fetchCells = cellsForHistoricalFetch(cells, panelOrder);
  const startHTTP = startDate.toHTTP();
  const endHTTP = endDate.toHTTP();
  const tasks = [];

  if (panelOrderNeedsPower(panelOrder)) {
    tasks.push(
      Promise.all(
        fetchCells.map(async ({ id, name }) => {
          const powerData = await getPowerData(id, startHTTP, endHTTP, resample);
          return [id, { name, powerData }];
        }),
      ).then((entries) => ({ kind: 'power', data: Object.fromEntries(entries) })),
    );
  }

  if (panelOrderNeedsTeros(panelOrder)) {
    tasks.push(
      Promise.all(
        fetchCells.map(async ({ id, name }) => {
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
  const sensorRequests = [
    ...collectUnifiedSensorRequests(panelOrder, cells, cellSensorsById),
    ...collectDbSensorPanelRequests(panelOrder, cells, cellSensorsById),
    ...collectEquationSensorRequests(panelOrder),
  ];
  const seen = new Set();
  const dedupedSensorRequests = sensorRequests.filter((request) => {
    if (seen.has(request.cacheKey)) return false;
    seen.add(request.cacheKey);
    return true;
  });

  if (dedupedSensorRequests.length === 0) {
    return { historicalSensorByKey: {} };
  }

  const entries = await Promise.all(
    dedupedSensorRequests.map(async ({ cacheKey, cellId, name, measurement }) => {
      const payload = await getSensorData(name, cellId, measurement, startHTTP, endHTTP, resample);
      return [cacheKey, payload];
    }),
  );

  return { historicalSensorByKey: Object.fromEntries(entries) };
}
