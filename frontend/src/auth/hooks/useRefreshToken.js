import axios from '../../api/axios';
import useAuth from './useAuth';

const useRefreshToken = () => {
  const { setAuth } = useAuth();
  const refresh = async () => {
    const response = await axios.get('/auth/refresh', {
      withCrednetials: true,
    });
    setAuth((prev) => {
      console.log(JSON.stringify(prev));
      console.log(response);
      console.log(response.data);
      return { ...prev, accessToken: response.data };
    });
    return response.data;
  };
  return refresh;
};

export default useRefreshToken;
