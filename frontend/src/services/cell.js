import axios from "axios";

export async function getCellData(cellId) {
  return axios.get(`${process.env.PUBLIC_URL}/api/cell/data/${cellId}`);
}

export async function getCellId(cellId) {
  return axios.get(`${process.env.PUBLIC_URL}/api/cell/data/${cellId}`);
}
