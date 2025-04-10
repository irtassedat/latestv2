// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

// Auth Context oluşturma
const AuthContext = createContext();

// Token'ın ne zaman sona ereceğini hesaplama (saniye cinsinden)
const calculateExpiryTime = (expiresIn) => {
  // expiresIn örnek: "1d", "2h", "30m"
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1));

  switch (unit) {
    case 'd': // gün
      return value * 24 * 60 * 60;
    case 'h': // saat
      return value * 60 * 60;
    case 'm': // dakika
      return value * 60;
    default: // saniye
      return value;
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Kullanıcı oturumunu kontrol et ve token yenileme işlemlerini yönet
  useEffect(() => {
    const loadUserFromStorage = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const expiryTime = localStorage.getItem('expiryTime');

      if (token && userData && expiryTime) {
        // Token süresi kontrolü
        const now = Math.floor(Date.now() / 1000);
        if (now < parseInt(expiryTime)) {
          // Token API isteklerinde kullanılacak
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setCurrentUser(JSON.parse(userData));
        } else {
          // Token süresi dolmuş, çıkış yap
          logout();
        }
      }

      setLoading(false);
    };

    loadUserFromStorage();

    // Token yenileme için zamanlayıcı
    const tokenTimer = setInterval(() => {
      const expiryTime = localStorage.getItem('expiryTime');
      if (expiryTime) {
        const now = Math.floor(Date.now() / 1000);
        // Token süresinin bitmesine 15 dakika kala yenile
        if (parseInt(expiryTime) - now < 15 * 60) {
          updateUserInfo().catch(() => {
            // Güncelleme başarısız olursa çıkış yap
            logout();
          });
        }
      }
    }, 60000); // Her dakika kontrol et

    return () => clearInterval(tokenTimer);
  }, []);

  // Giriş fonksiyonu
  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);

      console.log('AuthContext: Login denemesi', { username });

      const response = await api.post('/api/auth/login', { username, password });
      const { user, token, expiresIn } = response.data;

      console.log('Login başarılı, alınan token:', token ? 'var' : 'yok');

      // Token'ı ayarla
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Kullanıcı ve token bilgilerini localStorage'a kaydet
      const expiryTime = Math.floor(Date.now() / 1000) + calculateExpiryTime(expiresIn);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('expiryTime', expiryTime.toString());

      setCurrentUser(user);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Giriş sırasında bir hata oluştu';
      console.error('Login hatası:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Çıkış fonksiyonu
  const logout = () => {
    // Token ve kullanıcı bilgilerini temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('expiryTime');

    // API başlığından Authorization'ı kaldır
    delete api.defaults.headers.common['Authorization'];

    // Kullanıcı durumunu sıfırla
    setCurrentUser(null);

    // Giriş sayfasına yönlendir
    navigate('/login');
  };

  // Kullanıcı bilgilerini güncelleme
  const updateUserInfo = async () => {
    try {
      const response = await api.get('/api/auth/me');
      const userData = response.data;

      setCurrentUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      return userData;
    } catch (err) {
      // 401 hatası gelirse çıkış yap
      if (err.response?.status === 401) {
        logout();
      }
      console.error('Kullanıcı bilgileri güncellenirken hata:', err);
      throw err;
    }
  };

  // Şifre değiştirme
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Şifre değiştirilemedi';
      throw new Error(errorMessage);
    }
  };

  // Context değerleri
  const value = {
    currentUser,
    loading,
    error,
    isSuperAdmin: currentUser?.role === 'super_admin',
    isBranchManager: currentUser?.role === 'branch_manager',
    login,
    logout,
    updateUserInfo,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook - Auth context'i kullanmak için
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth hook must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;