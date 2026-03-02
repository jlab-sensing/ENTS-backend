import axios from 'axios';
import { DateTime } from 'luxon';
export const getSensorData = (name, cellId, meas, startTime, endTime, resample = 'hour') => {
  return axios
    .get(
      `${process.env.PUBLIC_URL}/api/sensor/?name=${name}&cellId=${cellId}&measurement=${meas}&startTime=${startTime}&endTime=${endTime}&resample=${resample}`,
    )
    .then((res) => res.data);
};

export const streamSensorData = (
  name,
  cellId,
  meas,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now(),
  stream,
) => {
  return axios
    .get(
      `${process.env.PUBLIC_URL}/api/sensor/?name=${name}&cellId=${cellId}&measurement=${meas}&startTime=${startTime}&endTime=${endTime}&stream=${stream}`,
    )
    .then((res) => res.data);
};
