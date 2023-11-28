import { React, createContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(null);
  const [user, setUser] = useState(null);

  const checkLoginState = useCallback(async () => {
    try {
      const {
        data: [{ loggedIn: loggedIn }, user],
      } = await axios.get(`${process.env.PUBLIC_URL}/api/auth/logged_in`);
      // const data = await axios.get(`${process.env.PUBLIC_URL}/api/auth/logged_in`);
      // console.log(data, loggedIn, user);
      setLoggedIn(loggedIn);
      user && setUser(user);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    checkLoginState();
  }, [checkLoginState]);
  return <AuthContext.Provider value={{ loggedIn, checkLoginState, user }}>{children}</AuthContext.Provider>;
};

export default AuthContextProvider;
