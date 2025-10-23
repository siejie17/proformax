import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // To handle splash/loading state
  const [user, setUser] = useState({});

  // Check if token exists on app start
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (token) {
          setIsLoggedIn(true);
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.log('Error checking login status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    setAuthToken();
  }, []);

  const login = async (token, userData) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
  };

  const updateUser = async (userData) => {
    let userBefore = await AsyncStorage.getItem('user');
    userBefore = JSON.parse(userBefore);

    const updatedUser = { ...userBefore, ...userData };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
