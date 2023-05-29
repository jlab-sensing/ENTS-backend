import axios from "axios";

export async function getPowerData(cellId) {
  return axios.get(`${process.env.PUBLIC_URL}/api/power/${cellId}`);
}
