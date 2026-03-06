import axios from 'axios';
import { DateTime } from 'luxon';

function fetchTimeseries(path, params) {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      acc[key] = value ?? '';
      return acc;
    }, {}),
  ).toString();

  return axios.get(`${process.env.PUBLIC_URL}${path}?${query}`).then((res) => res.data);
}

export const getSensorData = (name, cellId, meas, startTime, endTime, resample = 'hour') =>
  fetchTimeseries('/api/sensor/', {
    name,
    cellId,
    measurement: meas,
    startTime,
    endTime,
    resample,
  });

export const getSensorDataBatch = (name, cellIds, meas, startTime, endTime, resample = 'hour') => {
  return axios
    .get(
      `${process.env.PUBLIC_URL}/api/sensor/?name=${name}&cellIds=${cellIds.join(',')}&measurement=${meas}&startTime=${startTime}&endTime=${endTime}&resample=${resample}`,
    )
    .then((res) => res.data);
};

export const getCellSensors = (cellIds) => {
  return axios
    .get(`${process.env.PUBLIC_URL}/api/cell-sensors/?cell_ids=${cellIds.join(',')}`)
    .then((res) => res.data);
};

export const streamSensorData = (
  name,
  cellId,
  meas,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now(),
  stream,
) =>
  fetchTimeseries('/api/sensor/', {
    name,
    cellId,
    measurement: meas,
    startTime,
    endTime,
    stream,
  });

export const getPowerData = (
  cellId,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now(),
  resample = 'hour',
) =>
  fetchTimeseries(`/api/power/${cellId}`, {
    startTime,
    endTime,
    resample,
  });

export const streamPowerData = (
  cellId,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now(),
  stream,
) =>
  fetchTimeseries(`/api/power/${cellId}`, {
    startTime,
    endTime,
    stream,
  });

export const getTerosData = (
  cellId,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now(),
  resample = 'hour',
) =>
  fetchTimeseries(`/api/teros/${cellId}`, {
    startTime,
    endTime,
    resample,
  });

export const streamTerosData = (
  cellId,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now(),
  stream,
) =>
  fetchTimeseries(`/api/teros/${cellId}`, {
    startTime,
    endTime,
    stream,
  });
