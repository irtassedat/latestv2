import axios from "axios";

console.log("ENV:", import.meta.env);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ✅ .env'den al
});

export default api;
