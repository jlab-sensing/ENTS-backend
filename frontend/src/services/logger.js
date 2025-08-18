import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const getLoggers = () => {
  return axios
    .get(`${process.env.PUBLIC_URL}/api/logger/`)
    .then((res) => res.data)
    .catch((error) => {
      console.log('Error getting loggers:', error.response ? error.response.data : error.message);
    });
};

export const addLogger = (name, type, deviceEui, description, email) => {
  return axios
    .post(`${process.env.PUBLIC_URL}/api/logger/`, {
      name: name,
      type: type,
      device_eui: deviceEui,
      description: description,
      userEmail: email,
    })
    .then((res) => res.data)
    .catch((error) => {
      console.log(error);
      throw error;
    });
};

export const updateLogger = async (loggerId, updatedData) => {
  const url = `${process.env.PUBLIC_URL}/api/logger/${loggerId}`;
  try {
    const response = await axios.put(url, updatedData, { headers: { 'Content-Type': 'application/json' } });
    return response.data;
  } catch (error) {
    console.error('Error updating logger:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const deleteLogger = async (loggerId) => {
  const url = `${process.env.PUBLIC_URL}/api/logger/${loggerId}`;

  try {
    const response = await axios.delete(url, { headers: { 'Content-Type': 'application/json' } });
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