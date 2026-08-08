import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Deployed backend - no more local IP juggling across WiFi networks.
const BASE_URL = "https://kksdental-api.onrender.com/api";

const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("kksdental_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;