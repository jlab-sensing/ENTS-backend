import { create } from 'axios';

const RESOURCES_URL = `${process.env.PUBLIC_URL}/api`;

export default create({
  baseURL: RESOURCES_URL,
});

export const axiosPrivate = create({
  baseURL: RESOURCES_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
