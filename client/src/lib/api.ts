import axios from "axios";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
});
