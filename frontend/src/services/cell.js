import { useQuery, useQueries } from '@tanstack/react-query';
import axios from 'axios';
import { DateTime } from 'luxon';

export const getCellData = (cellId, startTime, endTime) => {
  return axios
    .get(`${process.env.PUBLIC_URL}/api/cell/data/${cellId}?startTime=${startTime}&endTime=${endTime}`)
    .then((res) => res.data);
};

export const useCellData = (cells, startTime = DateTime.now().minus({ months: 1 }), endTime = DateTime.now()) =>
  useQueries({
    queries: [
      cells.map((cell) => {
        return {
          queryKey: [cell.id],
          queryFn: () => getCellData(cell.id, startTime, endTime),
          enabled: cells.length != 0,
          refetchOnWindowFocus: false,
        };
      }),
    ],
  });

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
