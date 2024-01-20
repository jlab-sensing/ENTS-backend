import axios from 'axios';
import { DateTime } from 'luxon';
export const getSensorData = (
  cellId,
  meas,
  startTime = DateTime.now().minus({ months: 1 }),
  endTime = DateTime.now(),
) => {
  console.log('celllll', cellId);
  const params = {
    cellId: cellId,
    measurement: meas,
    startTime: startTime,
    endTime: endTime,
  };
  return axios.get(`${process.env.PUBLIC_URL}/api/sensor/`, { params }).then((res) => res.data);
};
