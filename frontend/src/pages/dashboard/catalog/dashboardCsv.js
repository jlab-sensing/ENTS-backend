import { DateTime } from 'luxon';
import { CHART_CONFIGS } from '../components/chartConfigs';
import { panelIdToUnifiedType } from './dashboardCatalog';
import { sensorDataCacheKey } from './historicalDataLoader';

/** Missing aligned values in exported rows (per mentor CSV format). */
export const CSV_MISSING = 'NAN';

/**
 * @typedef {object} CsvColumn
 * @property {string} key
 * @property {string} name
 * @property {string} unit
 * @property {string} type
 * @property {Map<number, number|null>} valuesByTs
 */

function resolveCellEntry(cellMap, cellId) {
  return cellMap?.[cellId] ?? cellMap?.[String(cellId)];
}

/**
 * @param {unknown[]} timestamps
 * @returns {number[]}
 */
export function timestampsToMillis(timestamps) {
  return (Array.isArray(timestamps) ? timestamps : []).map((raw) => {
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    const text = String(raw);
    const http = DateTime.fromHTTP(text);
    if (http.isValid) return http.toMillis();
    const iso = DateTime.fromISO(text);
    return iso.isValid ? iso.toMillis() : Number.NaN;
  });
}

/**
 * @param {number[]} timestampsMs
 * @param {unknown[]} values
 * @returns {Map<number, number|null>}
 */
export function seriesToValueMap(timestampsMs, values) {
  const map = new Map();
  timestampsMs.forEach((ts, idx) => {
    if (ts == null || Number.isNaN(ts)) return;
    const raw = values?.[idx];
    if (raw == null || raw === '') {
      map.set(ts, null);
      return;
    }
    const num = Number(raw);
    map.set(ts, Number.isNaN(num) ? null : num);
  });
  return map;
}

/**
 * @param {string} value
 */
export function escapeCsvField(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function columnDisplayName(baseName, cellName, multiCell) {
  return multiCell ? `${cellName} ${baseName}` : baseName;
}

/**
 * @param {Map<string, CsvColumn>} columnsByKey
 * @param {CsvColumn} column
 */
function addColumn(columnsByKey, column) {
  if (columnsByKey.has(column.key)) return;
  columnsByKey.set(column.key, column);
}

function addPowerColumns(columnsByKey, cell, powerData, fields, multiCell) {
  if (!powerData?.timestamp?.length) return;
  const timestampsMs = timestampsToMillis(powerData.timestamp);
  const specs = {
    v: { name: 'Voltage', unit: 'mV', type: 'POWER_VOLTAGE' },
    i: { name: 'Current', unit: 'uA', type: 'POWER_CURRENT' },
    p: { name: 'Power', unit: 'uW', type: 'POWER' },
  };

  fields.forEach((field) => {
    const spec = specs[field];
    if (!spec) return;
    addColumn(columnsByKey, {
      key: `${cell.id}:power:${field}`,
      name: columnDisplayName(spec.name, cell.name, multiCell),
      unit: spec.unit,
      type: spec.type,
      valuesByTs: seriesToValueMap(timestampsMs, powerData[field] || []),
    });
  });
}

function addTerosColumns(columnsByKey, cell, terosData, fields, multiCell) {
  if (!terosData?.timestamp?.length) return;
  const timestampsMs = timestampsToMillis(terosData.timestamp);
  const specs = {
    vwc: {
      name: 'Volumetric Water Content',
      unit: terosData.vwc_unit || '%',
      type: 'TEROS12_VWC',
    },
    ec: {
      name: 'Electrical Conductivity',
      unit: 'uS/cm',
      type: 'TEROS12_EC',
    },
    temp: {
      name: 'Temperature',
      unit: 'C',
      type: 'TEROS12_TEMP',
    },
    raw_vwc: {
      name: 'Volumetric Water Content (Raw)',
      unit: terosData.raw_vwc_unit || 'raw',
      type: 'TEROS12_VWC_RAW',
    },
  };

  fields.forEach((field) => {
    const spec = specs[field];
    if (!spec) return;
    addColumn(columnsByKey, {
      key: `${cell.id}:teros:${field}`,
      name: columnDisplayName(spec.name, cell.name, multiCell),
      unit: spec.unit,
      type: spec.type,
      valuesByTs: seriesToValueMap(timestampsMs, terosData[field] || []),
    });
  });
}

function addSensorColumns(columnsByKey, cell, config, historicalSensorByKey, multiCell) {
  if (!config?.sensor_name || !Array.isArray(config.measurements)) return;

  config.measurements.forEach((measurement, idx) => {
    const cacheKey = sensorDataCacheKey(cell.id, config.sensor_name, measurement);
    const payload = historicalSensorByKey?.[cacheKey];
    if (!payload?.timestamp?.length) return;

    const unit = config.units?.[idx] || payload.unit || '';
    const type = String(config.sensor_name || measurement).toUpperCase();
    addColumn(columnsByKey, {
      key: `${cell.id}:sensor:${config.sensor_name}:${measurement}`,
      name: columnDisplayName(measurement, cell.name, multiCell),
      unit,
      type,
      valuesByTs: seriesToValueMap(timestampsToMillis(payload.timestamp), payload.data || []),
    });
  });
}

/**
 * Collect export columns from currently loaded dashboard historical caches.
 *
 * @param {object} params
 * @param {Array<{ id: string|number, name?: string }>} params.cells
 * @param {string[]} params.panelOrder
 * @param {Record<string, { name?: string, powerData?: object }>} [params.historicalPowerByCell]
 * @param {Record<string, { name?: string, terosData?: object }>} [params.historicalTerosByCell]
 * @param {Record<string, object>} [params.historicalSensorByKey]
 * @returns {CsvColumn[]}
 */
export function collectExportColumns({
  cells,
  panelOrder,
  historicalPowerByCell = {},
  historicalTerosByCell = {},
  historicalSensorByKey = {},
}) {
  const columnsByKey = new Map();
  const loadCells = (Array.isArray(cells) ? cells : []).map((cell) => ({
    id: cell.id,
    name: cell.name ?? `Cell-${cell.id}`,
  }));
  const multiCell = loadCells.length > 1;
  const panels = Array.isArray(panelOrder) ? panelOrder : [];

  panels.forEach((panelId) => {
    loadCells.forEach((cell) => {
      if (panelId === 'power-vi') {
        const entry = resolveCellEntry(historicalPowerByCell, cell.id);
        addPowerColumns(columnsByKey, cell, entry?.powerData, ['v', 'i'], multiCell);
        return;
      }
      if (panelId === 'power-p') {
        const entry = resolveCellEntry(historicalPowerByCell, cell.id);
        addPowerColumns(columnsByKey, cell, entry?.powerData, ['p'], multiCell);
        return;
      }
      if (panelId === 'teros') {
        const entry = resolveCellEntry(historicalTerosByCell, cell.id);
        addTerosColumns(columnsByKey, cell, entry?.terosData, ['vwc', 'ec'], multiCell);
        return;
      }
      if (panelId === 'temp') {
        const entry = resolveCellEntry(historicalTerosByCell, cell.id);
        addTerosColumns(columnsByKey, cell, entry?.terosData, ['temp'], multiCell);
        return;
      }

      const unifiedType = panelIdToUnifiedType(panelId);
      if (!unifiedType) return;
      const config = CHART_CONFIGS[unifiedType];
      if (!config) return;
      addSensorColumns(columnsByKey, cell, config, historicalSensorByKey, multiCell);
    });
  });

  return [...columnsByKey.values()];
}

/**
 * Build a CSV string with a 3-row header (name / unit / type) and NAN for gaps.
 *
 * @param {object} params
 * @returns {string}
 */
export function buildDashboardCsv(params) {
  const columns = collectExportColumns(params);
  const allTimestamps = new Set();
  columns.forEach((column) => {
    column.valuesByTs.forEach((_, ts) => allTimestamps.add(ts));
  });
  const sortedTimestamps = [...allTimestamps].sort((a, b) => a - b);

  const nameRow = ['timestamp', ...columns.map((column) => column.name)];
  const unitRow = ['s', ...columns.map((column) => column.unit)];
  const typeRow = ['TIME', ...columns.map((column) => column.type)];

  const lines = [
    nameRow.map(escapeCsvField).join(','),
    unitRow.map(escapeCsvField).join(','),
    typeRow.map(escapeCsvField).join(','),
  ];

  sortedTimestamps.forEach((ts) => {
    const values = columns.map((column) => {
      if (!column.valuesByTs.has(ts)) return CSV_MISSING;
      const value = column.valuesByTs.get(ts);
      return value == null || Number.isNaN(value) ? CSV_MISSING : String(value);
    });
    lines.push([String(Math.floor(ts / 1000)), ...values].map(escapeCsvField).join(','));
  });

  return `${lines.join('\n')}\n`;
}

/**
 * @param {Array<{ id: string|number, name?: string }>} cells
 * @returns {string}
 */
export function defaultCsvFilename(cells) {
  if (!Array.isArray(cells) || cells.length === 0) return 'dirtviz-export.csv';
  if (cells.length === 1) {
    const raw = String(cells[0].name || `cell-${cells[0].id}`);
    const safe = raw.replace(/[^\w.-]+/g, '_');
    return `${safe || 'cell'}.csv`;
  }
  return 'dirtviz-export.csv';
}

/**
 * Trigger a browser download for a CSV string.
 * @param {string} filename
 * @param {string} csvText
 */
export function triggerCsvDownload(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = url;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
