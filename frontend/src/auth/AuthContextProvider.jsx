import { React, createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  // Initialize state from localStorage if available
  const [auth, setAuth] = useState(() => {
    try {
      const savedAuth = localStorage.getItem('auth');
      return savedAuth ? JSON.parse(savedAuth) : {};
    } catch (error) {
      console.error('Error loading auth from localStorage:', error);
      return {};
    }
  });

  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      const savedLoggedIn = localStorage.getItem('loggedIn');
      return savedLoggedIn === 'true';
    } catch (error) {
      console.error('Error loading loggedIn from localStorage:', error);
      return false;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      return null;
    }
  });

  // Only set loading to true if we don't have cached auth data
  // If we have cached data, we'll verify it in the background
  const [isAuthLoading, setIsAuthLoading] = useState(() => {
    try {
      const savedLoggedIn = localStorage.getItem('loggedIn');
      // If we have cached login state, start as not loading
      return savedLoggedIn !== 'true';
    } catch (error) {
      return true;
    }
  });

  // Persist auth state to localStorage whenever it changes
  useEffect(() => {
    try {
      if (auth && Object.keys(auth).length > 0) {
        localStorage.setItem('auth', JSON.stringify(auth));
      } else {
        localStorage.removeItem('auth');
      }
    } catch (error) {
      console.error('Error saving auth to localStorage:', error);
    }
  }, [auth]);

  useEffect(() => {
    try {
      localStorage.setItem('loggedIn', String(loggedIn));
    } catch (error) {
      console.error('Error saving loggedIn to localStorage:', error);
    }
  }, [loggedIn]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ auth, setAuth, user, setUser, loggedIn, setLoggedIn, isAuthLoading, setIsAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthContextProvider.propTypes = {
  children: PropTypes.any,
};

export default AuthContextProvider;
