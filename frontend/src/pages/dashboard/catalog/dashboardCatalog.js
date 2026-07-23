/** @typedef {'builtin' | 'unified' | 'sensor'} PanelKind */

/**
 * @typedef {object} CatalogEntry
 * @property {string} panelId
 * @property {string} label
 * @property {string} description
 * @property {string} category
 * @property {PanelKind} kind
 * @property {string} [unifiedType] - UnifiedChart `type` when kind === 'unified'
 * @property {number} [sensorId]
 * @property {string} [sensorName]
 * @property {string} [measurement]
 * @property {string} [unit]
 */

export const LAYOUT_VERSION = 'v1';

export const DEFAULT_DASHBOARD_PANEL_ORDER = ['power-vi', 'power-p', 'teros', 'temp'];

/** Built-in top-grid panels (PowerCharts / TerosCharts). */
export const BUILTIN_CATALOG = [
  {
    panelId: 'power-vi',
    label: 'Voltage & Current',
    description: 'power · voltage & current',
    category: 'power',
    kind: 'builtin',
  },
  {
    panelId: 'power-p',
    label: 'Power',
    description: 'power · µW',
    category: 'power',
    kind: 'builtin',
  },
  {
    panelId: 'teros',
    label: 'VWC & EC',
    description: 'teros · volumetric water & conductivity',
    category: 'teros',
    kind: 'builtin',
  },
  {
    panelId: 'temp',
    label: 'Temperature',
    description: 'teros · °C',
    category: 'teros',
    kind: 'builtin',
  },
];

/** Catalog entries backed by UnifiedChart types (legacy URL tokens). */
export const UNIFIED_CATALOG = [
  { panelId: 'u:co2', unifiedType: 'co2', label: 'CO₂', description: 'sensor · co2 · ppm', category: 'generic' },
  {
    panelId: 'u:presHum',
    unifiedType: 'presHum',
    label: 'Pressure & humidity',
    description: 'bme280 · pressure & humidity',
    category: 'generic',
  },
  {
    panelId: 'u:bme280Pressure',
    unifiedType: 'bme280Pressure',
    label: 'BME280 pressure',
    description: 'bme280 · pressure',
    category: 'generic',
  },
  {
    panelId: 'u:soilPot',
    unifiedType: 'soilPot',
    label: 'Soil water potential',
    description: 'teros21 · matric potential',
    category: 'generic',
  },
  {
    panelId: 'u:soilHum',
    unifiedType: 'soilHum',
    label: 'Soil humidity',
    description: 'sen0308 · humidity',
    category: 'generic',
  },
  {
    panelId: 'u:waterPress',
    unifiedType: 'waterPress',
    label: 'Water pressure',
    description: 'sen0257 · pressure',
    category: 'generic',
  },
  {
    panelId: 'u:waterFlow',
    unifiedType: 'waterFlow',
    label: 'Water flow',
    description: 'yfs210c · flow',
    category: 'generic',
  },
  {
    panelId: 'u:sensor',
    unifiedType: 'sensor',
    label: 'Dielectric permittivity',
    description: 'phytos31 · permittivity',
    category: 'generic',
  },
  {
    panelId: 'u:temperature',
    unifiedType: 'temperature',
    label: 'Temperature (BME280)',
    description: 'bme280 · temperature',
    category: 'generic',
  },
].map((entry) => ({ ...entry, kind: 'unified' }));

const ALL_ENTRIES = [...BUILTIN_CATALOG, ...UNIFIED_CATALOG];

const PANEL_ID_SET = new Set(ALL_ENTRIES.map((e) => e.panelId));

const SENSOR_PANEL_ID_RE = /^s:\d+$/;

/** Unified types rendered in the legacy bottom stack (auto, not in panel grid). */
export const LEGACY_BOTTOM_UNIFIED_TYPES = [
  'power_voltage',
  'power_current',
  'teros12_vwc',
  'teros12_vwc_adj',
  'teros12_temp',
  'teros12_ec',
  'soilPot',
  'presHum',
  'sensor',
  'co2',
  'temperature',
  'soilHum',
  'waterPress',
  'waterFlow',
  'waterFlowD10',
];

/**
 * @param {string} panelId
 * @returns {boolean}
 */
export function isSensorPanelEntry(panelId) {
  return typeof panelId === 'string' && SENSOR_PANEL_ID_RE.test(panelId);
}

/**
 * @param {string} panelId
 * @returns {number | null}
 */
export function sensorPanelIdToSensorId(panelId) {
  if (!isSensorPanelEntry(panelId)) return null;
  return Number(panelId.slice(2));
}

/**
 * @param {string} panelId
 * @returns {CatalogEntry | undefined}
 */
export function getCatalogEntry(panelId) {
  return ALL_ENTRIES.find((e) => e.panelId === panelId);
}

/**
 * @param {string} panelId
 */
export function isKnownPanelId(panelId) {
  return PANEL_ID_SET.has(panelId) || isSensorPanelEntry(panelId);
}

/**
 * @param {string} unifiedType
 */
export function unifiedTypeToPanelId(unifiedType) {
  return `u:${unifiedType}`;
}

/**
 * @param {string} panelId
 * @returns {string | null}
 */
export function panelIdToUnifiedType(panelId) {
  if (!panelId.startsWith('u:')) return null;
  return panelId.slice(2);
}

export { isDerivedPanelEntry, isLayoutPanelEntry, parseLayoutParam, serializeLayoutParam } from './layoutPanels';

/**
 * @param {string[]} panelOrder
 */
export function getUnifiedTypesInPanelOrder(panelOrder) {
  return panelOrder.map(panelIdToUnifiedType).filter(Boolean);
}

/**
 * @param {import('../../../services/catalog').CatalogApiEntry[]} apiEntries
 * @returns {CatalogEntry[]}
 */
export function catalogEntriesFromApi(apiEntries) {
  if (!Array.isArray(apiEntries)) return [...ALL_ENTRIES];

  const byId = new Map(ALL_ENTRIES.map((e) => [e.panelId, e]));
  return apiEntries
    .map((row) => {
      if (row.kind === 'sensor' || isSensorPanelEntry(row.panel_id)) {
        return {
          panelId: row.panel_id,
          label: row.label || row.measurement || row.sensor_name || row.panel_id,
          description: row.description || '',
          category: row.category || 'generic',
          kind: 'sensor',
          sensorId: row.sensor_id,
          sensorName: row.sensor_name,
          measurement: row.measurement,
          unit: row.unit || '',
        };
      }

      const base = byId.get(row.panel_id);
      if (!base) return null;
      return {
        ...base,
        label: row.label || base.label,
        description: row.description || base.description,
      };
    })
    .filter(Boolean);
}

export { ALL_ENTRIES as FULL_CATALOG };
