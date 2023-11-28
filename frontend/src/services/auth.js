import axios from 'axios';

export const signIn = async () => {
  // return window.location.href = `(`${process.env.PUBLIC_URL}/api/login`).then((res) => res.data);
  // axios
  //   .post(`${process.env.PUBLIC_URL}/api/auth`)
  //   .then((res) => res.data)
  //   .catch((error) => {
  //     console.log(error);
  //   });
  // return (window.location.href = '/');

  try {
    // Gets authentication url from backend server
    const {
      data: { url },
    } = await axios.get(`${process.env.PUBLIC_URL}/api/oauth/url`);
    // await axios.get(`${process.env.PUBLIC_URL}/api/login`);
    // Navigate to consent screen
    window.location.assign(url);
  } catch (err) {
    console.error(err);
  }

  // window.open(`${process.env.PUBLIC_URL}/api/login`, '_self');
};
