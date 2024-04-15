import axios from 'axios';
import { DateTime } from 'luxon';
// import { useQuery } from 'react-query';

export const getPowerData = (cellId, startTime = DateTime.now().minus({ months: 1 }), endTime = DateTime.now()) => {
  return axios
    .get(`${process.env.PUBLIC_URL}/api/power/${cellId}?startTime=${startTime}&endTime=${endTime}&resample=day`)
    .then((res) => res.data);
};

export const streamPowerData = (
  cellId,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now(),
  stream,
) => {
  return axios
    .get(`${process.env.PUBLIC_URL}/api/power/${cellId}?startTime=${startTime}&endTime=${endTime}&stream=${stream}`)
    .then((res) => res.data);
};
