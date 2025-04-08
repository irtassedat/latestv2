// src/lib/axios.js
import axios from "axios";

// For debugging
console.log("Environment vars for API URL:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE
});

// Determine the API base URL
const determineBaseUrl = () => {
  // Set from environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback based on environment - PORT'U 5050 OLARAK GÜNCELLEDIK
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5050'; // 5000 yerine 5050 kullanın
  }
  
  // Production fallback
  return 'https://qr.405found.tr';
};

const api = axios.create({
  baseURL: determineBaseUrl(),
  timeout: 10000,
  withCredentials: true
});

// Request interceptor to fix API path issues
api.interceptors.request.use(config => {
  // Check if we need to add /api prefix for production
  if (import.meta.env.MODE === 'production' && 
      !config.url.startsWith('/api/') && 
      !config.url.startsWith('api/')) {
    config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
  }
  
  console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Log detailed error information
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