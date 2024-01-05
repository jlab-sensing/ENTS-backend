import axios from 'axios';

export const signIn = async () => {
  try {
    // Gets authentication url from backend server
    const {
      data: { url },
    } = await axios.get(`${process.env.PUBLIC_URL}/api/oauth/url`);
    // Navigate to consent screen
    window.location.assign(url);
  } catch (err) {
    console.error(err);
  }
};
