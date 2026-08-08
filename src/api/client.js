import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// For physical device testing over Wi-Fi: use your computer's local IP
// (found via `ipconfig` on Windows, look for "IPv4 Address"), not localhost -
// the phone can't resolve "localhost" as your computer.
// Once deployed, point this at Render instead, e.g.
// "https://kksdental-api.onrender.com/api" - matches the CatalystIQ pattern.
const BASE_URL = "http://192.168.31.214:4000/api";

const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("kksdental_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;