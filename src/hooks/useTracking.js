// src/hooks/useTracking.js
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/axios';

// Benzersiz session ID oluştur
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Kullanıcı oturumunu kontrol et/oluştur
const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('session_id');
  
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('session_id', sessionId);
  }
  
  return sessionId;
};

export default function useTracking() {
  const location = useLocation();
  const sessionId = getOrCreateSessionId();
  
  // Sayfa görüntüleme izleme
  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Clarity olayı
        if (window.clarity) {
          window.clarity("set", "page_path", location.pathname);
        }
        
        // Backend'e olay gönder
        await api.post('/analytics/events/track', {
          event_type: 'page_view',
          session_id: sessionId,
          page_url: location.pathname,
          metadata: {
            referrer: document.referrer,
            route: location.pathname,
            search: location.search,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
          }
        });
        
        console.log('📊 Sayfa görüntüleme izlendi:', location.pathname);
      } catch (error) {
        console.error('Sayfa görüntüleme izleme hatası:', error);
      }
    };
    
    trackPageView();
  }, [location.pathname, sessionId]);
  
  // Genel olay izleme
  const trackEvent = useCallback(async (eventType, data = {}) => {
    try {
      // Clarity olayı
      if (window.clarity) {
        window.clarity("event", eventType, data);
      }
      
      // Backend'e olay gönder
      await api.post('/analytics/events/track', {
        event_type: eventType,
        session_id: sessionId,
        page_url: location.pathname,
        product_id: data.productId,
        metadata: {
          ...data,
          route: location.pathname
        }
      });
      
      console.log(`📊 ${eventType} olayı izlendi:`, data);
    } catch (error) {
      console.error(`${eventType} olayı izleme hatası:`, error);
    }
  }, [sessionId, location.pathname]);
  
  // Tıklama izleme
  const trackClick = useCallback(async (e, additionalData = {}) => {
    try {
      // Tıklama koordinatlarını ve element bilgilerini al
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      
      const elementData = {
        elementId: e.currentTarget.id,
        elementClass: e.currentTarget.className,
        elementTag: e.currentTarget.tagName,
        elementText: e.currentTarget.innerText ? e.currentTarget.innerText.slice(0, 50) : '',
      };
      
      // Clarity olayı
      if (window.clarity) {
        window.clarity("event", "element_click", {
          ...elementData,
          ...additionalData,
          x, y
        });
      }
      
      // Backend'e olay gönder
      await api.post('/analytics/events/track', {
        event_type: 'click',
        session_id: sessionId,
        page_url: location.pathname,
        product_id: additionalData.productId,
        element_id: elementData.elementId,
        element_class: elementData.elementClass,
        element_tag: elementData.elementTag,
        element_text: elementData.elementText,
        x, y,
        screen_x: e.screenX,
        screen_y: e.screenY,
        window_width: window.innerWidth,
        window_height: window.innerHeight,
        metadata: additionalData
      });
    } catch (error) {
      console.error('Tıklama izleme hatası:', error);
    }
  }, [sessionId, location.pathname]);
  
  return {
    trackEvent,
    trackClick,
    sessionId
  };
}