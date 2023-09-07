import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { DateTime } from 'luxon';

export const getCellData = (cellId, startTime, endTime) => {
  return axios.get(`${process.env.PUBLIC_URL}/api/cell/data/${cellId}?startTime=${startTime}&endTime=${endTime}`);
};

export const useCellData = (cellId, startTime = DateTime.now().minus({ months: 1 }), endTime = DateTime.now()) =>
  useQuery({
    queryKey: ['cell data'],
    queryFn: () => getCellData(cellId, startTime, endTime),
    refetchOnWindowFocus: false,
  });

export const getCells = () => {
  return axios.get(`${process.env.PUBLIC_URL}/api/cell/id`).then((res) => res.data);
};

export const useCells = () =>
  useQuery({
    queryKey: ['cell info'],
    queryFn: () => getCells(),
    refetchOnWindowFocus: false,
  });
