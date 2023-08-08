import axios from 'axios';
import { DateTime } from 'luxon';

export async function getTerosData(
  cellId,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now()
) {
  return axios.get(
    `${process.env.PUBLIC_URL}/api/teros/${cellId}?startTime=${startTime}&endTime=${endTime}`
  );
}
