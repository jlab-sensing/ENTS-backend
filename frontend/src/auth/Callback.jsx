import { React, useContext, useRef, useEffect } from 'react';
import { AuthContext } from './AuthContextProvider';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const Callback = () => {
  const called = useRef(false);
  const { checkLoginState, loggedIn } = useContext(AuthContext);
  console.log('Calledback', loggedIn);
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      if (loggedIn === false) {
        try {
          if (called.current) return; // prevent rerender caused by StrictMode
          called.current = true;
          await axios.get(`${process.env.PUBLIC_URL}/api/auth/token${window.location.search}`);
          checkLoginState();
          navigate('/');
        } catch (err) {
          console.error(err);
          navigate('/');
        }
      } else if (loggedIn === true) {
        navigate('/');
      }
    })();
  }, [checkLoginState, loggedIn, navigate]);
  return <></>;
};

export default Callback;
