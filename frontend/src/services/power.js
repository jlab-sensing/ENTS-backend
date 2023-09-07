import axios from 'axios';
import { DateTime } from 'luxon';
// import { useQuery } from 'react-query';

export const getPowerData = (cellId, startTime = DateTime.now().minus({ months: 1 }), endTime = DateTime.now()) => {
  return axios
    .get(`${process.env.PUBLIC_URL}/api/power/${cellId}?startTime=${startTime}&endTime=${endTime}`)
    .then((res) => res.data);
};

// export const usePowerData = (cellId, startTime = DateTime.now().minus({ months: 1 }), endTime = DateTime.now()) =>
//   useQuery('power data', () => getPowerData(cellId, startTime, endTime), { enabled: 'true' });
