import { DateTime } from 'luxon';
import { getPowerData } from '../../../services/power';
import { getSensorData } from '../../../services/sensor';
import { getTerosData } from '../../../services/teros';
import { evaluateEquationAt, extractCellStreamRefs } from './equationParser';
import { resolveStreamSpec } from './equationStreams';

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
 * @returns {Promise<Map<number, number>>}
 */
async function fetchRefMap(ref, startDate, endDate, resample) {
  const match = ref.match(/^(\d+):([a-zA-Z][a-zA-Z0-9_]*)$/);
  if (!match) throw new Error(`Invalid reference "${ref}"`);

  const cellId = Number(match[1]);
  const streamKey = match[2];
  const { timestamps, values } = await fetchStreamSeries(cellId, streamKey, startDate, endDate, resample);
  const map = new Map();
  timestamps.forEach((ts, idx) => {
    const raw = values[idx];
    const num = raw == null ? null : Number(raw);
    if (num != null && !Number.isNaN(num)) {
      map.set(ts, num);
    }
  });
  return map;
}

/**
 * @param {string} expression
 * @param {import('luxon').DateTime} startDate
 * @param {import('luxon').DateTime} endDate
 * @param {string} [resample]
 * @returns {Promise<{ timestamps: number[], values: (number | null)[] } | null>}
 */
export async function buildDerivedSeries(expression, startDate, endDate, resample = 'hour') {
  const refs = extractCellStreamRefs(expression);
  if (refs.length === 0) return null;

  const refMaps = await Promise.all(
    refs.map(async (ref) => ({ ref, map: await fetchRefMap(ref, startDate, endDate, resample) })),
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
