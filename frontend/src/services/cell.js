import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const getCellData = (cellIds, resample, startTime, endTime) => {
  return axios
    .get(`${process.env.PUBLIC_URL}/api/cell/datas?cellIds=${cellIds.toString()}&resample=${resample}&startTime=${startTime.toHTTP()}&endTime=${endTime.toHTTP()}`)
    .then((res) => res.data);
};

export const getCells = () => {
  return axios.get(`${process.env.PUBLIC_URL}/api/cell/id`).then((res) => res.data);
};

export const addCell = (cellName, location, longitude, latitude) => {
  return axios
    .post(`${process.env.PUBLIC_URL}/api/cell/`, {
      name: cellName,
      location: location,
      longitude: longitude,
      latitude: latitude,
    })
    .then((res) => res.data)
    .catch((error) => {
      console.log(error);
    });
};

export const useCells = () =>
  useQuery({
    queryKey: ['cell info'],
    queryFn: () => getCells(),
    refetchOnWindowFocus: false,
  });
