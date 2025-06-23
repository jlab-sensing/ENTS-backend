import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const getCellData = (cellIds, resample, startTime, endTime) => {
  return axios
    .get(
      `${
        process.env.PUBLIC_URL
      }/api/cell/datas?cellIds=${cellIds.toString()}&resample=${resample}&startTime=${startTime.toHTTP()}&endTime=${endTime.toHTTP()}`,
    )
    .then((res) => res.data);
};

export const getCells = () => {
  return axios
    .get(`${process.env.PUBLIC_URL}/api/cell/id`)
    .then((res) => res.data)
    .catch((error) => {
      console.log('Error getting cells:', error.response ? error.response.data : error.message);
    });
};

export const addCell = (cellName, location, longitude, latitude, archive, email) => {
  return axios
    .post(`${process.env.PUBLIC_URL}/api/cell/`, {
      name: cellName,
      location: location,
      longitude: longitude,
      latitude: latitude,
      archive: archive,
      userEmail: email,
    })
    .then((res) => res.data)
    .catch((error) => {
      console.log(error);
    });
};

// used to edit cell data in the table with put request - BACKEND NOT YET IMPLEMENTED
export const updateCell = async (cellId, updatedData) => {
  const url = `${process.env.PUBLIC_URL}/api/cell/${cellId}`;
  try {
    //console.log('Sending payload', updatedData);
    const response = await axios.put(url, updatedData, { headers: { 'Content-Type': 'application/json' }});
    return response.data;
    
  } catch (error) {
    console.error('Error updating cell:', error.response ? error.response.data : error.message);
    throw error;
  }
};


export const deleteCell = async (cellId) => {
  const url = `${process.env.PUBLIC_URL}/api/cell/${cellId}`;

  try {
    const response = await axios.delete(url, { headers: { 'Content-Type': 'application/json' } });
    return response.data;
  } catch (error) {
    console.error('Error deleting cell:', error.response ? error.response.data : error.message);
    throw error; // Rethrow the error for further handling
  }
};

export const getUserCells = (axiosPrivate) => {
  return axiosPrivate.get(`${process.env.PUBLIC_URL}/cell/?user=True`).then((res) => res.data);
};

export const useCells = () =>
  useQuery({
    queryKey: ['cell info'],
    queryFn: () => getCells(),
    refetchOnWindowFocus: true,
  });

export const useUserCells = (axiosPrivate) =>
  useQuery({
    queryKey: ['user cell info'],
    queryFn: () => getUserCells(axiosPrivate),
    refetchOnWindowFocus: true,
  });

export const setCellArchive = async (cellId, archive) => {
  const url = `${process.env.PUBLIC_URL}/api/cell/${cellId}`;
  try {
    const response = await axios.put(url, { archive }, { headers: { 'Content-Type': 'application/json' } });
    return response.data;
  } catch (error) {
    console.error('Error setting cell archive:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const useSetCellArchive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cellId, archive }) => setCellArchive(cellId, archive),
    onSuccess: () => {
      // Invalidate or refetch the cells query to get updated data
      queryClient.invalidateQueries(['cell info']);
    },
    onError: (error) => {
      console.error('Error setting cell archive:', error);
    },
  });
};

export const pollCellDataResult = (taskId) => {
  return axios.get(`${process.env.PUBLIC_URL}/api/status/${taskId}`).then((res) => {
    return res.data;
  });
};
