import axios from 'axios';
import { DateTime } from 'luxon';

export async function getTerosData(cellId, startTime = DateTime.now().minus({ months: 1 }), endTime = DateTime.now()) {
  return axios
    .get(`${process.env.PUBLIC_URL}/api/teros/${cellId}?startTime=${startTime}&endTime=${endTime}`)
    .then((res) => res.data);
}

export const streamTerosData = (
  cellId,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now(),
  stream,
) => {
  return axios
    .get(`${process.env.PUBLIC_URL}/api/teros/${cellId}?startTime=${startTime}&endTime=${endTime}&stream=${stream}`)
    .then((res) => res.data);
};
