import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.0.92:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const setAuthToken = async () => {
  const token = await AsyncStorage.getItem('token');
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Password update function
export const updatePassword = async (newPassword) => {
  try {
    await setAuthToken();
    const response = await api.put('/user/update-password', {
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Password update error:', error);
    throw error.response?.data || { message: 'Failed to update password' };
  }
};

// User field update function
export const updateUserField = async (fieldName, fieldValue) => {
  try {
    await setAuthToken();
    const response = await api.patch('/user/profile', {
      [fieldName]: fieldValue
    });
    return response;
  } catch (error) {
    console.error('User field update error:', error);
    throw error.response?.data || { message: `Failed to update ${fieldName}` };
  }
};

export default api;
