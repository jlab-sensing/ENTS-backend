import { React, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import useAuth from './hooks/useAuth';

const Callback = () => {
  const called = useRef(false);
  const { setAuth, loggedIn, setLoggedIn } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      if (loggedIn === false) {
        try {
          if (called.current) return; // prevent rerender caused by StrictMode
          called.current = true;
          const data = await axios
            .get(`${process.env.PUBLIC_URL}/auth/token${window.location.search}`)
            .then((resp) => resp.data);
          setAuth({ accessToken: data });
          setLoggedIn(true);
          navigate('/');
        } catch (err) {
          console.error(err);
          navigate('/');
        }
      } else if (loggedIn === true) {
        navigate('/');
      }
    })();
  }, [loggedIn, navigate]);
  return <></>;
};

export default Callback;
