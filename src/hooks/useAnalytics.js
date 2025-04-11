// src/hooks/useAnalytics.js
import { useState, useEffect } from 'react';
import api from '../lib/axios';

// Basit bir localStorage önbellek
const localCache = {
  get: (key) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    try {
      const { data, expiry } = JSON.parse(item);
      if (expiry < Date.now()) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch (e) {
      localStorage.removeItem(key);
      return null;
    }
  },
  set: (key, data, ttl = 3600000) => { // 1 saat varsayılan
    const item = {
      data,
      expiry: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  }
};

export function useAnalytics(endpoint, params = {}, mockData = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setUsingMockData(false);
      
      // Params string'i oluştur
      const paramsStr = Object.entries(params)
        .map(([key, value]) => `${key}=${value||'all'}`)
        .join('_');
      
      // Önbellek anahtarını oluştur
      const cacheKey = `analytics_${endpoint}_${paramsStr}`;
      
      try {
        // Önbellekten kontrol et
        const cachedData = localCache.get(cacheKey);
        if (cachedData) {
          console.log(`Önbellekten veri alındı: ${endpoint}`);
          setData(cachedData);
          setLoading(false);
          return;
        }
        
        // API'den veri getir
        const response = await api.get(`/api/analytics/${endpoint}`, { params });
        setData(response.data);
        
        // Önbelleğe al
        localCache.set(cacheKey, response.data);
      } catch (err) {
        console.error(`${endpoint} verileri alınırken hata:`, err);
        setError(err);
        
        // Hata durumunda mock data kullan
        if (mockData) {
          console.log(`${endpoint} için örnek veriler kullanılıyor`);
          setData(mockData);
          setUsingMockData(true);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [endpoint, JSON.stringify(params)]);
  
  return { data, loading, error, usingMockData };
}