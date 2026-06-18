/**
 * Shorthand stream keys for equation tokens like `2:vwc` or `1:co2`.
 * Keys are matched case-insensitively.
 */

/** @typedef {'teros' | 'power' | 'sensor'} StreamSource */

/**
 * @typedef {object} EquationStreamSpec
 * @property {StreamSource} source
 * @property {string} label
 * @property {string} [field] - teros/power API field
 * @property {string} [sensorName]
 * @property {string} [measurement]
 */

/** @type {Record<string, EquationStreamSpec>} */
export const EQUATION_STREAMS = {
  vwc: { source: 'teros', field: 'vwc', label: 'VWC' },
  temp: { source: 'teros', field: 'temp', label: 'Temperature' },
  ec: { source: 'teros', field: 'ec', label: 'EC' },
  voltage: { source: 'power', field: 'v', label: 'Voltage' },
  v: { source: 'power', field: 'v', label: 'Voltage' },
  current: { source: 'power', field: 'i', label: 'Current' },
  i: { source: 'power', field: 'i', label: 'Current' },
  power: { source: 'power', field: 'p', label: 'Power' },
  p: { source: 'power', field: 'p', label: 'Power' },
  co2: { source: 'sensor', sensorName: 'co2', measurement: 'co2', label: 'CO₂' },
  bme280: { source: 'sensor', sensorName: 'bme280', measurement: 'pressure', label: 'BME280 pressure' },
  pressure: { source: 'sensor', sensorName: 'bme280', measurement: 'pressure', label: 'Pressure' },
  humidity: { source: 'sensor', sensorName: 'bme280', measurement: 'humidity', label: 'Humidity' },
  temperature: { source: 'sensor', sensorName: 'bme280', measurement: 'temperature', label: 'BME280 temp' },
  soil_water_potential: {
    source: 'sensor',
    sensorName: 'teros21',
    measurement: 'soil_water_potential',
    label: 'Soil water potential',
  },
  teros21: { source: 'sensor', sensorName: 'teros21', measurement: 'soil_water_potential', label: 'TEROS-21' },
  flow: { source: 'sensor', sensorName: 'yfs210c', measurement: 'flow', label: 'Water flow' },
  yfs210c: { source: 'sensor', sensorName: 'yfs210c', measurement: 'flow', label: 'Water flow' },
};

/**
 * @param {string} streamKey
 * @returns {EquationStreamSpec | undefined}
 */
export function resolveStreamSpec(streamKey) {
  if (!streamKey || typeof streamKey !== 'string') return undefined;
  return EQUATION_STREAMS[streamKey.toLowerCase()];
}

/** @returns {string[]} */
export function listEquationStreamKeys() {
  return Object.keys(EQUATION_STREAMS).sort();
}
