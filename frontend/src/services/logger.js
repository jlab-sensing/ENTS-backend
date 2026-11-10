import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const getLoggers = () => {
  return axios
    .get(`${process.env.PUBLIC_URL}/api/logger/`)
    .then((res) => res.data)
    .catch((error) => {
      console.log('Error getting loggers:', error.response ? error.response.data : error.message);
    });
};

export const addLogger = (name, type, devEui, description, email, axiosPrivate) => {
  // Device EUI is optional.
  const isEnts = (type || '').toLowerCase() === 'ents';
  const hasTtnFields = isEnts && Boolean(devEui);
  const payload = {
    name: name,
    type: type,
    description: description,
    userEmail: email,
  };

  if (devEui) {
    payload.device_eui = devEui;
  }

  if (hasTtnFields) {
    // dev_eui is used for TTN registration.
    payload.dev_eui = devEui;
  }

  return axiosPrivate
    .post(`${process.env.PUBLIC_URL}/logger/`, payload)
    .then((res) => res.data)
    .catch((error) => {
      console.log(error);
      throw error;
    });
};

export const updateLogger = async (loggerId, updatedData, accessToken) => {
  const url = `${process.env.PUBLIC_URL}/api/logger/${loggerId}`;
  try {
    const response = await axios.put(url, updatedData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating logger:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const deleteLogger = async (loggerId, accessToken) => {
  const url = `${process.env.PUBLIC_URL}/api/logger/${loggerId}`;

  try {
    const response = await axios.delete(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting logger:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const getUserLoggers = (axiosPrivate) => {
  return axiosPrivate.get(`${process.env.PUBLIC_URL}/logger/?user=True`).then((res) => res.data);
};

export const useLoggers = () =>
  useQuery({
    queryKey: ['logger info'],
    queryFn: () => getLoggers(),
    refetchOnWindowFocus: true,
  });

export const useUserLoggers = (axiosPrivate) =>
  useQuery({
    queryKey: ['user logger info'],
    queryFn: () => getUserLoggers(axiosPrivate),
    refetchOnWindowFocus: true,
  });
