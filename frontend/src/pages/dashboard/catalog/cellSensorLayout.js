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
        if (panelId && isKnownPanelId(panelId)) {
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
  return sortPanelIds(panelSet);
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
 * @param {string[]} panelOrder
 * @param {Set<string>} availablePanelIds
 * @returns {string[]}
 */
export function panelsMissingForCells(panelOrder, availablePanelIds) {
  return panelOrder.filter(
    (panelId) => !isDerivedLayoutEntry(panelId) && !availablePanelIds.has(panelId),
  );
}
