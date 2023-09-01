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

// export async function getCellDataChartFormat(
//   cellId,
//   startTime = DateTime.now().minus({ months: 1 }),
//   endTime = DateTime.now()
// ) {
//   const res = await Promise.all([
//     axios.get(
//       `${process.env.PUBLIC_URL}/api/power/${cellId}?startTime=${startTime}&endTime=${endTime}`
//     ),
//     axios.get(
//       `${process.env.PUBLIC_URL}/api/teros/${cellId}?startTime=${startTime}&endTime=${endTime}`
//     ),
//   ]);
//   const data = res.map((res) => res.data);
//   console.log(data.flat());
//   return data;
// }

export async function getCellIds() {
  return axios.get(`${process.env.PUBLIC_URL}/api/cell/id`);
}
