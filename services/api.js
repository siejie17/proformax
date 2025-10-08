import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.1.106:8000/api";

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

export default api;
