import { DateTime } from 'luxon';
import { toPercentIfFraction } from '../../../charts/VwcChart/vwcValue';
import { getPowerData } from '../../../services/power';
import { getSensorData } from '../../../services/sensor';
import { getTerosData } from '../../../services/teros';
import {
  extractUnifiedStreamValue,
  matchesSensorStreamType,
} from '../components/unifiedChartUtils';
import { sensorDataCacheKey } from '../catalog/historicalDataLoader';
import { evaluateEquationAt, extractCellStreamRefs } from './equationParser';
import { resolveGenericStreamType, resolveStreamSpec } from './equationStreams';

/** Max live points kept for derived equation charts (matches dashboard live buffer). */
export const LIVE_DERIVED_MAX_POINTS = 100;

/**
 * @typedef {object} HistoricalCache
 * @property {Record<string, unknown>} [historicalPowerByCell]
 * @property {Record<string, unknown>} [historicalTerosByCell]
 * @property {Record<string, unknown>} [historicalSensorByKey]
 */

function resolveCellEntry(cellMap, cellId) {
  return cellMap?.[cellId] ?? cellMap?.[String(cellId)];
}

/**
 * @param {number} cellId
 * @param {string} streamKey
 * @param {HistoricalCache} cache
 * @returns {{ timestamps: number[], values: unknown[] } | null}
 */
export function streamSeriesFromHistoricalCache(cellId, streamKey, cache) {
  const spec = resolveStreamSpec(streamKey);
  if (!spec || !cache) return null;

  if (spec.source === 'teros') {
    const entry = resolveCellEntry(cache.historicalTerosByCell, cellId);
    const terosData = entry?.terosData;
    if (!terosData?.timestamp?.length) return null;
    return {
      timestamps: terosData.timestamp.map((t) => DateTime.fromHTTP(t).toMillis()),
      values: terosData[spec.field] || [],
    };
  }

  if (spec.source === 'power') {
    const entry = resolveCellEntry(cache.historicalPowerByCell, cellId);
    const powerData = entry?.powerData;
    if (!powerData?.timestamp?.length) return null;
    return {
      timestamps: powerData.timestamp.map((t) => DateTime.fromHTTP(t).toMillis()),
      values: powerData[spec.field] || [],
    };
  }

  const cacheKey = sensorDataCacheKey(cellId, spec.sensorName, spec.measurement);
  const payload = cache.historicalSensorByKey?.[cacheKey];
  if (!payload?.timestamp?.length) return null;
  return {
    timestamps: payload.timestamp.map((t) => DateTime.fromHTTP(t).toMillis()),
    values: payload.data || [],
  };
}

/**
 * Read a generic `ents` packet (one SensorType, one value) for a stream spec.
 *
 * A generic packet carries a single measurement, so composite fields such as
 * power `p` (voltage times current) cannot be satisfied by one and are treated
 * as not applicable rather than missing.
 *
 * @param {import('./equationStreams').EquationStreamSpec} spec
 * @param {import('./equationStreams').GenericStreamType} generic
 * @param {object} data
 * @returns {number | null | undefined}
 */
function genericValueForStreamSpec(spec, generic, data) {
  if (spec.source !== generic.source) return undefined;

  if (spec.source === 'sensor') {
    if (spec.sensorName?.toLowerCase() !== generic.sensorName?.toLowerCase()) return undefined;
    if (spec.measurement?.toLowerCase() !== generic.measurement?.toLowerCase()) return undefined;
  } else if (spec.field !== generic.field) {
    return undefined;
  }

  const raw = data[generic.dataKey];
  if (raw == null || raw === '') return null;
  const n = Number(generic.field === 'vwc' ? toPercentIfFraction(raw) : raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Extract a numeric value for an equation ref from one live websocket measurement.
 * Returns `undefined` when the packet does not apply to this ref (wrong cell/type).
 * Returns `null` when it applies but the value is missing.
 *
 * @param {string} ref - e.g. "3:vwc"
 * @param {{ type?: string, cellId?: number|string, data?: object }} measurement
 * @returns {number | null | undefined}
 */
export function liveValueForEquationRef(ref, measurement) {
  if (!measurement || typeof ref !== 'string') return undefined;
  const match = ref.match(/^(\d+):([a-zA-Z][a-zA-Z0-9_]*)$/);
  if (!match) return undefined;

  const cellId = Number(match[1]);
  const streamKey = match[2];
  if (Number(measurement.cellId) !== cellId) return undefined;

  const spec = resolveStreamSpec(streamKey);
  if (!spec) return undefined;

  const data = measurement.data || {};

  const generic = resolveGenericStreamType(measurement.type);
  if (generic) {
    return genericValueForStreamSpec(spec, generic, data);
  }

  if (spec.source === 'power') {
    if (measurement.type !== 'power') return undefined;
    if (spec.field === 'v') {
      const n = Number(data.voltage);
      return Number.isFinite(n) ? n : null;
    }
    if (spec.field === 'i') {
      const n = Number(data.current);
      return Number.isFinite(n) ? n : null;
    }
    if (spec.field === 'p') {
      const v = Number(data.voltage);
      const i = Number(data.current);
      return Number.isFinite(v) && Number.isFinite(i) ? v * i : null;
    }
    return undefined;
  }

  if (spec.source === 'teros') {
    if (measurement.type !== 'teros12') return undefined;
    if (spec.field === 'vwc') {
      const n = Number(toPercentIfFraction(data.vwcAdj));
      return Number.isFinite(n) ? n : null;
    }
    if (spec.field === 'temp') {
      const n = Number(data.temp);
      return Number.isFinite(n) ? n : null;
    }
    if (spec.field === 'ec') {
      const n = Number(data.ec);
      return Number.isFinite(n) ? n : null;
    }
    return undefined;
  }

  if (spec.source === 'sensor') {
    if (!matchesSensorStreamType(measurement.type, spec.sensorName)) return undefined;
    const raw = extractUnifiedStreamValue(spec.sensorName, spec.measurement, data);
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  return undefined;
}

/**
 * Build a derived series from live websocket packets using latest-value semantics.
 *
 * Operands often arrive in separate packets (or the same packet for teros vwc+temp).
 * When any needed ref updates, if all refs have a known value, evaluate at that
 * packet's timestamp. This is the reliable approach for live multi-sensor formulas
 * (exact timestamp intersection almost never lines up across sensor families).
 *
 * @param {string} expression
 * @param {Array<{ type?: string, cellId?: number|string, timestamp?: number, data?: object }>} liveData
 * @param {{ maxPoints?: number }} [options]
 * @returns {{ timestamps: number[], values: (number | null)[] } | null}
 */
export function buildDerivedSeriesFromLiveData(expression, liveData, options = {}) {
  const maxPoints = options.maxPoints ?? LIVE_DERIVED_MAX_POINTS;
  const refs = extractCellStreamRefs(expression);
  if (refs.length === 0) return null;

  /** @type {Record<string, number | null>} */
  const latest = Object.fromEntries(refs.map((ref) => [ref, null]));
  const timestamps = [];
  const values = [];

  const packets = Array.isArray(liveData) ? [...liveData] : [];
  packets.sort((a, b) => Number(a?.timestamp) - Number(b?.timestamp));

  packets.forEach((measurement) => {
    let touched = false;
    refs.forEach((ref) => {
      const next = liveValueForEquationRef(ref, measurement);
      if (next !== undefined) {
        latest[ref] = next;
        touched = true;
      }
    });
    if (!touched) return;
    if (refs.some((ref) => latest[ref] == null || Number.isNaN(latest[ref]))) return;

    const tsSec = Number(measurement.timestamp);
    if (!Number.isFinite(tsSec)) return;

    timestamps.push(tsSec * 1000);
    values.push(evaluateEquationAt(expression, { ...latest }));
  });

  if (timestamps.length === 0) return null;
  if (timestamps.length <= maxPoints) {
    return { timestamps, values };
  }
  return {
    timestamps: timestamps.slice(-maxPoints),
    values: values.slice(-maxPoints),
  };
}

function seriesToRefMap(series) {
  const map = new Map();
  series.timestamps.forEach((ts, idx) => {
    const raw = series.values[idx];
    const num = raw == null ? null : Number(raw);
    if (num != null && !Number.isNaN(num)) {
      map.set(ts, num);
    }
  });
  return map;
}

/**
 * @param {number} cellId
 * @param {string} streamKey
 * @param {import('luxon').DateTime} startDate
 * @param {import('luxon').DateTime} endDate
 * @param {string} resample
 * @returns {Promise<{ timestamps: number[], values: (number | null)[] }>}
 */
async function fetchStreamSeries(cellId, streamKey, startDate, endDate, resample) {
  const spec = resolveStreamSpec(streamKey);
  if (!spec) {
    throw new Error(`Unknown stream "${streamKey}"`);
  }

  const start = startDate.toHTTP();
  const end = endDate.toHTTP();

  if (spec.source === 'teros') {
    const data = await getTerosData(cellId, start, end, resample);
    const timestamps = (data.timestamp || []).map((t) => DateTime.fromHTTP(t).toMillis());
    return { timestamps, values: data[spec.field] || [] };
  }

  if (spec.source === 'power') {
    const data = await getPowerData(cellId, start, end, resample);
    const timestamps = (data.timestamp || []).map((t) => DateTime.fromHTTP(t).toMillis());
    return { timestamps, values: data[spec.field] || [] };
  }

  const data = await getSensorData(spec.sensorName, cellId, spec.measurement, start, end, resample);
  const timestamps = (data.timestamp || []).map((t) => DateTime.fromHTTP(t).toMillis());
  return { timestamps, values: data.data || [] };
}

/**
 * @param {string} ref - e.g. "2:vwc"
 * @param {import('luxon').DateTime} startDate
 * @param {import('luxon').DateTime} endDate
 * @param {string} resample
 * @param {HistoricalCache | null} [cache]
 * @param {boolean} [useCache]
 * @returns {Promise<Map<number, number>>}
 */
async function fetchRefMap(ref, startDate, endDate, resample, cache = null, useCache = false) {
  const match = ref.match(/^(\d+):([a-zA-Z][a-zA-Z0-9_]*)$/);
  if (!match) throw new Error(`Invalid reference "${ref}"`);

  const cellId = Number(match[1]);
  const streamKey = match[2];

  if (useCache) {
    const cachedSeries = streamSeriesFromHistoricalCache(cellId, streamKey, cache);
    if (cachedSeries) {
      return seriesToRefMap(cachedSeries);
    }
    return new Map();
  }

  const { timestamps, values } = await fetchStreamSeries(cellId, streamKey, startDate, endDate, resample);
  return seriesToRefMap({ timestamps, values });
}

/**
 * @param {string} expression
 * @param {import('luxon').DateTime} startDate
 * @param {import('luxon').DateTime} endDate
 * @param {string} [resample]
 * @param {{ useCentralCache?: boolean, historicalCache?: HistoricalCache | null }} [options]
 * @returns {Promise<{ timestamps: number[], values: (number | null)[] } | null>}
 */
export async function buildDerivedSeries(expression, startDate, endDate, resample = 'hour', options = {}) {
  const { useCentralCache = false, historicalCache = null } = options;
  const useCache = Boolean(useCentralCache);

  const refs = extractCellStreamRefs(expression);
  if (refs.length === 0) return null;

  const refMaps = await Promise.all(
    refs.map(async (ref) => ({
      ref,
      map: await fetchRefMap(ref, startDate, endDate, resample, historicalCache, useCache),
    })),
  );

  if (refMaps.some(({ map }) => map.size === 0)) return null;

  let commonTimestamps = null;
  for (const { map } of refMaps) {
    const ts = [...map.keys()].sort((a, b) => a - b);
    if (commonTimestamps == null) {
      commonTimestamps = ts;
    } else {
      const set = new Set(ts);
      commonTimestamps = commonTimestamps.filter((t) => set.has(t));
    }
  }

  if (!commonTimestamps || commonTimestamps.length === 0) return null;

  const values = commonTimestamps.map((ts) => {
    const env = {};
    for (const { ref, map } of refMaps) {
      env[ref] = map.get(ts);
    }
    return evaluateEquationAt(expression, env);
  });

  return { timestamps: commonTimestamps, values };
}

/**
 * @param {number[]} timestamps
 * @param {(number | null)[]} values
 * @returns {{ datasets: { label: string, data: { x: number, y: number | null }[], borderColor: string, borderWidth: number }[] }}
 */
export function derivedSeriesToChartData(expression, timestamps, values) {
  const data = timestamps.map((x, i) => ({ x, y: values[i] }));
  return {
    datasets: [
      {
        label: expression,
        data,
        borderColor: '#112e51',
        borderWidth: 2,
      },
    ],
  };
}
