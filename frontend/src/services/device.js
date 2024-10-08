import axios from 'axios';

export async function addDevice(name, axiosPrivate) {
  try {
    return await axiosPrivate
      .post(`${process.env.PUBLIC_URL}/device`, {
        name: name,
      })
      .then((res) => res.data.api_key);
  } catch (err) {
    console.error(err);
  }
}

export async function getDevices() {
  try {
    return await axios.get(`${process.env.PUBLIC_URL}/api/device/id`).then((res) => res.data);
  } catch (err) {
    console.error(err);
  }
}
