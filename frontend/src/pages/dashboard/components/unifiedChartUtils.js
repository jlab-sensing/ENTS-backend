import { toPercentIfFraction } from '../../../charts/VwcChart/vwcValue';

function normalize(value) {
  return String(value || '').toLowerCase();
}

export function matchesSensorStreamType(measurementType, sensorName) {
  const measurement = normalize(measurementType);
  const sensor = normalize(sensorName);

  if (!measurement || !sensor) return false;
  if (measurement === sensor) return true;

  if (sensor.startsWith('power_')) return measurement === 'power';
  if (sensor.startsWith('teros12_')) return measurement === 'teros12';
  return false;
}

const VALUE_ALIASES = {
  POWER_VOLTAGE: ['power_voltage', 'voltage'],
  POWER_CURRENT: ['power_current', 'current'],
  TEROS12_VWC: ['Volumetric Water Content (Raw)', 'Volumetric Water Content', 'teros12_vwc_raw', 'vwcRaw', 'teros12_vwc'],
  TEROS12_VWC_ADJ: ['Volumetric Water Content', 'teros12_vwc', 'vwcAdj'],
  TEROS12_TEMP: ['Temperature', 'teros12_temp', 'temp'],
  TEROS12_EC: ['Electrical Conductivity', 'teros12_ec', 'ec'],
  bme280: ['temperature', 'pressure', 'humidity'],
  co2: ['co2', 'CO2'],
  phytos31: ['dielectric_permittivity', 'voltage'],
  teros21: ['soil_water_potential', 'matricPot'],
  sen0308: ['humidity'],
  sen0257: ['pressure'],
  yfs210c: ['flow'],
};

export function extractUnifiedStreamValue(sensorName, measurementLabel, measurementData) {
  if (!measurementData || typeof measurementData !== 'object') return null;

  const aliases = [
    measurementLabel,
    ...(VALUE_ALIASES[sensorName] || []),
  ];

  for (const key of aliases) {
    if (Object.prototype.hasOwnProperty.call(measurementData, key)) {
      return measurementData[key];
    }
  }
  return null;
}

export function normalizeUnifiedStreamValue(sensorName, measurementLabel, value) {
  if (sensorName === 'TEROS12_VWC_ADJ' && measurementLabel === 'Volumetric Water Content') {
    return toPercentIfFraction(value);
  }
  return value;
}
