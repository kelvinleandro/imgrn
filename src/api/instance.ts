import axios from "axios";

const SERVER_URL =
  process.env.EXPO_PUBLIC_SERVER_BASE_URL || "http://192.168.1.64:8000";

const axiosInstance = axios.create({
  baseURL: SERVER_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "multipart/form-data",
  },
  responseType: "arraybuffer",
});

export default axiosInstance;