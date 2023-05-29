import axios from "axios";

export async function getTerosData(cellId) {
  return axios.get(`${process.env.PUBLIC_URL}/api/teros/${cellId}`);
}
