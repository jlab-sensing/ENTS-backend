import { CHART_CONFIGS } from '../components/chartConfigs';
import { getSensorCatalog } from '../../../services/catalog';
import { getCellSensors } from '../../../services/cell';
import { measurementMatches } from '../components/unifiedChartUtils';
import { isDerivedLayoutEntry } from '../equation/equationParser';
import {
  BUILTIN_CATALOG,
  UNIFIED_CATALOG,
  isKnownPanelId,
  isSensorPanelEntry,
} from './dashboardCatalog';
import { findSensorByPanelId } from './historicalDataLoader';

/** Map UnifiedChart config keys to dashboard panel IDs. */
const CHART_TYPE_TO_PANEL_ID = {
  power_voltage: 'power-vi',
  power_current: 'power-vi',
  teros12_vwc: 'teros',
  teros12_vwc_adj: 'teros',
  teros12_ec: 'teros',
  teros12_temp: 'temp',
  co2: 'u:co2',
  presHum: 'u:presHum',
  bme280Pressure: 'u:bme280Pressure',
  soilPot: 'u:soilPot',
  soilHum: 'u:soilHum',
  waterPress: 'u:waterPress',
  waterFlow: 'u:waterFlow',
  sensor: 'u:sensor',
  temperature: 'u:temperature',
  bme280Temperature: 'u:temperature',
};

const BUILTIN_PANEL_ORDER = BUILTIN_CATALOG.map((e) => e.panelId);

function withoutRedundantPanels(panelIds) {
  const next = new Set(panelIds);
  if (next.has('u:presHum')) {
    next.delete('u:bme280Pressure');
  }
  return next;
}

function normalizeChartKey(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Map a DB sensor row onto a UnifiedChart panel (`u:…`) when CHART_CONFIGS matches.
 *
 * Never maps onto builtin power/teros panels (`power-vi`, `teros`, `temp`). Those
 * read legacy tables; generic SensorType rows (`POWER_VOLTAGE`, `TEROS12_*`) live
 * in the sensor table. Collapsing them onto builtins drops the working `s:` chart
 * and leaves an empty Voltage & Current panel (#815 / #816 regression).
 *
 * @param {{ name?: string, measurement?: string }} sensor
 * @returns {string | null}
 */
export function unifiedPanelIdForSensor(sensor) {
  if (!sensor?.name) return null;

  const match = Object.entries(CHART_CONFIGS).find(
    ([, config]) =>
      sensor.name === config.sensor_name &&
      measurementMatches(sensor.measurement, config.measurements),
  );
  if (!match) return null;

  const panelId = CHART_TYPE_TO_PANEL_ID[match[0]];
  if (!panelId || !isKnownPanelId(panelId) || !panelId.startsWith('u:')) return null;
  return panelId;
}

/**
 * Stable identity so Soil Tension on cell A (`s:2029`) and cell B (`s:2030`)
 * occupy one chart. Unified types reuse their panel id; unmatched sensors
 * group by name + measurement.
 *
 * @param {string} panelId
 * @param {Record<string, unknown[]>} [cellSensorsById]
 * @returns {string}
 */
export function chartIdentityForPanel(panelId, cellSensorsById) {
  if (!panelId) return '';
  if (isDerivedLayoutEntry(panelId)) return `eq:${panelId}`;
  if (!isSensorPanelEntry(panelId)) return panelId;

  const sensor = findSensorByPanelId(cellSensorsById, panelId);
  if (!sensor?.name) return panelId;

  const unified = unifiedPanelIdForSensor(sensor);
  if (unified) return unified;
  return `sensor:${normalizeChartKey(sensor.name)}:${normalizeChartKey(sensor.measurement)}`;
}

/**
 * @param {{ panelId: string, kind?: string, sensorName?: string, measurement?: string }} entry
 * @returns {string}
 */
export function chartIdentityForCatalogEntry(entry) {
  if (!entry?.panelId) return '';
  if (entry.kind === 'sensor' || isSensorPanelEntry(entry.panelId)) {
    if (entry.sensorName) {
      const unified = unifiedPanelIdForSensor({
        name: entry.sensorName,
        measurement: entry.measurement,
      });
      if (unified) return unified;
      return `sensor:${normalizeChartKey(entry.sensorName)}:${normalizeChartKey(entry.measurement)}`;
    }
  }
  return entry.panelId;
}

/**
 * Keep the first panel of each chart identity. Later `s:` ids for the same
 * measurement are dropped — UnifiedChart already overlays all selected cells.
 *
 * @param {string[]} panelOrder
 * @param {Record<string, unknown[]>} [cellSensorsById]
 * @returns {string[]}
 */
export function dedupeEquivalentPanels(panelOrder, cellSensorsById) {
  if (!Array.isArray(panelOrder) || panelOrder.length === 0) return [];

  const seen = new Set();
  const next = [];
  panelOrder.forEach((panelId) => {
    const identity = chartIdentityForPanel(panelId, cellSensorsById);
    if (seen.has(identity)) return;
    seen.add(identity);
    next.push(panelId);
  });
  return next;
}

/**
 * @param {Record<string, unknown[]>} cellSensorsById
 * @param {Array<string|number>} selectedCellIds
 * @returns {Set<string>}
 */
export function panelIdsFromCellSensors(cellSensorsById, selectedCellIds) {
  const selectedSet = new Set(selectedCellIds.map((id) => id.toString()));
  const panelIds = new Set();

  Object.entries(cellSensorsById).forEach(([cellId, sensors]) => {
    if (!selectedSet.has(cellId) || !Array.isArray(sensors)) return;

    sensors.forEach((sensor) => {
      if (sensor?.id != null) {
        panelIds.add(`s:${sensor.id}`);
      }
    });

    Object.entries(CHART_CONFIGS).forEach(([chartType, config]) => {
      const matches = sensors.some(
        (sensor) =>
          sensor?.name === config.sensor_name && measurementMatches(sensor?.measurement, config.measurements),
      );
      if (matches) {
        const panelId = CHART_TYPE_TO_PANEL_ID[chartType];
        // Only auto-add UnifiedChart panels. Builtin power/teros come from the
        // catalog when legacy PowerData/TEROSData rows exist.
        if (panelId && isKnownPanelId(panelId) && panelId.startsWith('u:')) {
          panelIds.add(panelId);
        }
      }
    });
  });

  return withoutRedundantPanels(panelIds);
}

/**
 * @param {Set<string>} panelSet
 * @returns {string[]}
 */
export function sortPanelIds(panelSet) {
  const ordered = [];

  if (panelSet.has('power-vi')) {
    ordered.push('power-vi');
  }

  BUILTIN_PANEL_ORDER.forEach((panelId) => {
    if (panelId !== 'power-vi' && panelSet.has(panelId)) {
      ordered.push(panelId);
    }
  });

  UNIFIED_CATALOG.forEach((entry) => {
    if (panelSet.has(entry.panelId) && !ordered.includes(entry.panelId)) {
      ordered.push(entry.panelId);
    }
  });

  [...panelSet]
    .filter((panelId) => isSensorPanelEntry(panelId) && !ordered.includes(panelId))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach((panelId) => ordered.push(panelId));

  return ordered;
}

/**
 * @param {Array<string|number>} cellIds
 * @returns {Promise<Record<string, unknown[]>>}
 */
export async function fetchCellSensorsForCells(cellIds) {
  if (!cellIds.length) return {};

  const entries = await Promise.all(
    cellIds.map(async (cellId) => {
      const sensors = await getCellSensors(cellId);
      return [String(cellId), Array.isArray(sensors) ? sensors : []];
    }),
  );

  return Object.fromEntries(entries);
}

/**
 * @param {Array<string|number>} cellIds
 * @returns {Promise<string[]>}
 */
export async function fetchCatalogPanelIdsForCells(cellIds) {
  if (!cellIds.length) return [];

  const lists = await Promise.all(
    cellIds.map((cellId) =>
      getSensorCatalog(cellId).then((entries) =>
        Array.isArray(entries) ? entries.map((e) => e.panel_id).filter(isKnownPanelId) : [],
      ),
    ),
  );

  const seen = new Set();
  lists.forEach((ids) => {
    ids.forEach((panelId) => seen.add(panelId));
  });

  return sortPanelIds(seen);
}

/**
 * @param {Record<string, unknown[]>} cellSensorsById
 * @param {Array<string|number>} cellIds
 * @param {string[]} catalogPanelIds
 * @returns {string[]}
 */
export function defaultPanelOrderFromFetched(cellSensorsById, cellIds, catalogPanelIds = []) {
  const fromSensors = panelIdsFromCellSensors(cellSensorsById, cellIds);
  const panelSet = withoutRedundantPanels([...catalogPanelIds, ...fromSensors]);
  return dedupeEquivalentPanels(sortPanelIds(panelSet), cellSensorsById);
}

export async function buildDefaultPanelOrder(cellIds) {
  const [cellSensorsById, catalogOrder] = await Promise.all([
    fetchCellSensorsForCells(cellIds),
    fetchCatalogPanelIdsForCells(cellIds),
  ]);

  return {
    panelOrder: defaultPanelOrderFromFetched(cellSensorsById, cellIds, catalogOrder),
    cellSensorsById,
  };
}

/**
 * @param {Record<string, unknown[]>} cellSensorsById
 * @param {Array<string|number>} cellIds
 * @param {string[]} catalogPanelIds
 * @returns {Set<string>}
 */
export function availablePanelIdsForCells(cellSensorsById, cellIds, catalogPanelIds = []) {
  const fromSensors = panelIdsFromCellSensors(cellSensorsById, cellIds);
  return new Set([...catalogPanelIds, ...fromSensors]);
}

/**
 * Merges newly available panel IDs into an existing panel order without reordering,
 * then deduplicates equivalent panels. Used to auto-append panels when a new cell
 * is added interactively while preserving the user's current panel arrangement.
 *
 * @param {string[]} prevOrder - the existing panel order
 * @param {Set<string>} newAvailablePanelIds - all panels available for the current cell set
 * @param {object} sensors - cellSensorsById map (passed to dedupeEquivalentPanels)
 * @returns {string[]}
 */
export function mergePanelsForAddedCells(prevOrder, newAvailablePanelIds, sensors) {
  const merged = [...prevOrder];
  newAvailablePanelIds.forEach((panelId) => {
    if (!merged.includes(panelId)) {
      merged.push(panelId);
    }
  });
  return dedupeEquivalentPanels(merged, sensors);
}

/**
 * Returns true when the user has replaced their entire cell selection with a
 * completely different set (no overlap). Used to trigger a fresh panel order
 * instead of keeping stale panels from the previous selection.
 *
 * False on initial load (prevCellIds is null), when cells share any overlap
 * with the previous selection, and when the next set is empty.
 *
 * @param {Set<string> | null} prevCellIds
 * @param {string[]} nextCellIds
 * @returns {boolean}
 */
export function isCompleteCellSwap(prevCellIds, nextCellIds) {
  if (!prevCellIds || prevCellIds.size === 0) return false;
  const nextSet = new Set(nextCellIds.map(String));
  if (nextSet.size === 0) return false;
  return ![...prevCellIds].some((id) => nextSet.has(id));
}

/**
 * Returns true only when the user has interactively added cells to an existing
 * selection. False on initial load (prevCellIds is null), when cells are removed
 * or swapped, and when called with an empty previous set.
 *
 * Used to decide whether to auto-append new panels or preserve the existing layout.
 *
 * @param {Set<string> | null} prevCellIds - cell IDs from the previous render, or
 *   null when sensors have never been loaded (initial page load).
 * @param {string[]} nextCellIds - the IDs from the current selectedCells.
 * @returns {boolean}
 */
export function isInteractiveCellAdd(prevCellIds, nextCellIds) {
  if (!prevCellIds || prevCellIds.size === 0) return false;
  const nextSet = new Set(nextCellIds.map(String));
  if (nextSet.size <= prevCellIds.size) return false;
  return [...prevCellIds].every((id) => nextSet.has(id));
}

/**
 * @param {string[]} panelOrder
 * @param {Set<string>} availablePanelIds
 * @returns {string[]}
 */
export function panelsMissingForCells(panelOrder, availablePanelIds) {
  return panelOrder.filter(
    (panelId) => !isDerivedLayoutEntry(panelId) && !availablePanelIds.has(panelId),
  );
}
