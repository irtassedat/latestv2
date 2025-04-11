// src/lib/axios.js
import axios from "axios";

// Debugging
console.log("Environment vars for API URL:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE
});

// API base URL'yi belirle
const determineBaseUrl = () => {
  // Direkt URL'yi kullan, /api eki ekleme
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5050';
  }

  // Sadece domain kullan, /api ekini KALDIRDIM
  return 'https://qr.405found.tr';
};

const api = axios.create({
  baseURL: determineBaseUrl(),
  timeout: 30000, 
  withCredentials: false
});

// API isteklerini normalize eden interceptor
api.interceptors.request.use(config => {
  // Orijinal URL'yi logla
  console.log('Original request URL:', config.url);
  
  // Çift /api/api hatasını düzelt
  if (config.url.includes('/api/api/')) {
    config.url = config.url.replace('/api/api/', '/api/');
    console.log('Fixed double API prefix:', config.url);
  }
  
  // URL'nin başında /api varsa bırak, yoksa ekle
  if (!config.url.startsWith('/api/')) {
    config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
  }
  
  // Son URL'yi logla
  console.log(`Final request URL: ${config.baseURL}${config.url}`);
  return config;
}, error => {
  return Promise.reject(error);
});

// Hata yakalama interceptor'ı
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