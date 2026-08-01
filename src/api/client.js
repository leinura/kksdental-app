import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Point this at your Render deployment once the backend is live, e.g.
// "https://kksdental-api.onrender.com/api" - matches the CatalystIQ pattern.
const BASE_URL = "http://localhost:4000/api";

const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("kksdental_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
