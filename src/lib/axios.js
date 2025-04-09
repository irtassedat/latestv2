// src/lib/axios.js
import axios from "axios";

// For debugging
console.log("Environment vars for API URL:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE
});

// Determine the API base URL
const determineBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5050';
  }

  // API soneki olmadan domain kullanın
  return 'https://qr.405found.tr'; 
};
const api = axios.create({
  baseURL: determineBaseUrl(),
  timeout: 10000,
  withCredentials: false
});

// Request interceptor to fix API path issues
api.interceptors.request.use(config => {
  let url = config.url;
  console.log('Original URL:', url);

  // API prefixleri temizleme
  if (url.includes('/api/api/')) {
    url = url.replace('/api/api/', '/api/');
    console.log('Fixed double API prefix:', url);
  }

  // URL için api prefix kontrolü
  if (!url.startsWith('/api/')) {
    url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  }

  config.url = url;
  console.log(`Final URL: ${config.baseURL}${config.url}`);
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error("API Error:", {
      endpoint: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    return Promise.reject(error);
  }
);

export default api;
