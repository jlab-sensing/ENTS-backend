import axios from "axios";
import { DateTime } from "luxon";

export async function getPowerData(
  cellId,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now()
) {
  return axios.get(
    `${process.env.PUBLIC_URL}/api/power/${cellId}?startTime=${startTime}&endTime=${endTime}`
  );
}
