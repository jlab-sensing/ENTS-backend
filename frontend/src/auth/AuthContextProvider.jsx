import { React, createContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  // const [loggedIn, setLoggedIn] = useState(false);
  // const [user, setUser] = useState(null);

  const [auth, setAuth] = useState({
    user: null,
    loggedIn: false,
  });

  const checkLoginState = useCallback(async () => {
    try {
      const {
        data: [{ loggedIn: loggedIn }, user],
      } = await axios.get(`${process.env.PUBLIC_URL}/api/auth/logged_in`);
      if (user) {
        setAuth({
          user: user,
          loggedIn: loggedIn,
        });
      }
      // setLoggedIn(loggedIn);
      // user && setUser(user);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    checkLoginState();
  }, [checkLoginState]);
  return <AuthContext.Provider value={{ auth, setAuth, checkLoginState }}>{children}</AuthContext.Provider>;
};

AuthContextProvider.propTypes = {
  children: PropTypes.any,
};

export default AuthContextProvider;
