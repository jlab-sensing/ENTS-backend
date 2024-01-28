import axios from 'axios';
const RESOURCES_URL = `${process.env.PUBLIC_URL}/api`;

export default axios.create({
  baseURL: RESOURCES_URL,
});

export const axiosPrivate = axios.create({
  baseURL: RESOURCES_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
