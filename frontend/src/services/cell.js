import axios from 'axios';
import { DateTime } from 'luxon';

export async function getCellData(
  cellId,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now()
) {
  return axios.get(
    `${process.env.PUBLIC_URL}/api/cell/data/${cellId}?startTime=${startTime}&endTime=${endTime}`
  );
}

export async function getCellIds() {
  return axios.get(`${process.env.PUBLIC_URL}/api/cell/id`);
}
