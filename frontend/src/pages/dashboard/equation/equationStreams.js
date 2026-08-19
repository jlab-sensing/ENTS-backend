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

/**
 * Live packets arrive in two shapes. Legacy protobuf ingest tags them by sensor
 * family (`power`, `teros12`) with lowercase field keys. Generic `ents` ingest
 * tags them by SensorType (`POWER_VOLTAGE`) and keys the payload by the
 * measurement's display name (`Voltage`), per the `ents` SENSOR_DATA table.
 *
 * `dataKey` is that display name; `source`/`field`/`sensorName`/`measurement`
 * identify which EquationStreamSpec the packet can satisfy.
 *
 * @typedef {object} GenericStreamType
 * @property {StreamSource} source
 * @property {string} dataKey
 * @property {string} [field]
 * @property {string} [sensorName]
 * @property {string} [measurement]
 */

/** @type {Record<string, GenericStreamType>} */
export const GENERIC_STREAM_TYPES = {
  power_voltage: { source: 'power', field: 'v', dataKey: 'Voltage' },
  power_current: { source: 'power', field: 'i', dataKey: 'Current' },
  teros12_vwc_adj: { source: 'teros', field: 'vwc', dataKey: 'Volumetric Water Content' },
  teros12_temp: { source: 'teros', field: 'temp', dataKey: 'Temperature' },
  teros12_ec: { source: 'teros', field: 'ec', dataKey: 'Electrical Conductivity' },
  bme280_temp: {
    source: 'sensor',
    sensorName: 'bme280',
    measurement: 'temperature',
    dataKey: 'Temperature',
  },
  bme280_pressure: {
    source: 'sensor',
    sensorName: 'bme280',
    measurement: 'pressure',
    dataKey: 'Pressure',
  },
  bme280_humidity: {
    source: 'sensor',
    sensorName: 'bme280',
    measurement: 'humidity',
    dataKey: 'Humidity',
  },
  teros21_matric_pot: {
    source: 'sensor',
    sensorName: 'teros21',
    measurement: 'soil_water_potential',
    dataKey: 'Matric Potential',
  },
  yfs210c_flow: {
    source: 'sensor',
    sensorName: 'yfs210c',
    measurement: 'flow',
    dataKey: 'Flow Rate',
  },
};

/**
 * @param {string} measurementType
 * @returns {GenericStreamType | undefined}
 */
export function resolveGenericStreamType(measurementType) {
  if (!measurementType || typeof measurementType !== 'string') return undefined;
  return GENERIC_STREAM_TYPES[measurementType.toLowerCase()];
}

/** @returns {string[]} */
export function listEquationStreamKeys() {
  return Object.keys(EQUATION_STREAMS).sort();
}
