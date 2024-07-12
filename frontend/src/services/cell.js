import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const getCellData = (cellIds, resample, startTime, endTime) => {
  return axios
    .get(
      `${
        process.env.PUBLIC_URL
      }/api/cell/datas?cellIds=${cellIds.toString()}&resample=${resample}&startTime=${startTime.toHTTP()}&endTime=${endTime.toHTTP()}`,
      { responseType: 'blob' },
    )
    .then((res) => res.data);
};

export const getCells = () => {
  return axios.get(`${process.env.PUBLIC_URL}/api/cell/id`).then((res) => res.data);
};

export const addCell = (cellName, location, longitude, latitude, archive) => {
  return axios
    .post(`${process.env.PUBLIC_URL}/api/cell/`, {
      name: cellName,
      location: location,
      longitude: longitude,
      latitude: latitude,
      archive: archive
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

  export const setCellArchive = async (cellId, archive) => {
    const url = `${process.env.PUBLIC_URL}/api/cell/${cellId}`;
    console.log('Setting cell archive URL:', url);
    try {
      const response = await axios.put(
        url,
        { archive },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      console.error('Error setting cell archive:', error.response ? error.response.data : error.message);
      throw error;
    }
  };
  
  