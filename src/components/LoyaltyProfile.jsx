import { useState, useEffect } from 'react';
import { FiGift, FiStar, FiClock } from 'react-icons/fi';
import api from '../lib/axios';

const LoyaltyProfile = ({ customer }) => {
  const [loyaltyAccounts, setLoyaltyAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyAccounts();
  }, []);

  const fetchLoyaltyAccounts = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      const response = await api.get('/api/loyalty/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoyaltyAccounts(response.data);
    } catch (err) {
      console.error('Sadakat hesapları yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'PLATINUM': return 'from-gray-400 to-gray-600';
      case 'GOLD': return 'from-yellow-400 to-yellow-600';
      case 'SILVER': return 'from-gray-300 to-gray-500';
      default: return 'from-amber-600 to-amber-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loyaltyAccounts.map(account => (
        <div
          key={account.id}
          className={`relative overflow-hidden rounded-xl shadow-lg bg-gradient-to-br ${getTierColor(account.tier_level)} text-white`}
        >
          <div className="p-6">
            {/* Üst Başlık */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{account.brand_name}</h3>
                <p className="text-sm opacity-90">{account.tier_level} Üye</p>
              </div>
              <img
                src={account.logo_url || '/default-logo.png'}
                alt={account.brand_name}
                className="h-12 w-12 object-contain bg-white/10 rounded-lg p-2"
              />
            </div>

            {/* Puan Bilgisi */}
            <div className="mb-6">
              <div className="text-3xl font-bold">{account.current_points}</div>
              <div className="text-sm opacity-75">Mevcut Puan</div>
            </div>

            {/* Alt Bilgiler */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FiStar className="opacity-75" />
                <div>
                  <div className="font-medium">{account.lifetime_points}</div>
                  <div className="opacity-75 text-xs">Toplam Puan</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <FiClock className="opacity-75" />
                <div>
                  <div className="font-medium">
                    {account.tier_expiry_date 
                      ? new Date(account.tier_expiry_date).toLocaleDateString() 
                      : 'Süresiz'}
                  </div>
                  <div className="opacity-75 text-xs">Seviye Süresi</div>
                </div>
              </div>
            </div>

            {/* Kartın dalgalı deseni */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-white/5 rounded-full"></div>
          </div>
        </div>
      ))}

      {loyaltyAccounts.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-xl">
          <FiGift size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Henüz Sadakat Kartınız Yok</h3>
          <p className="text-gray-500 mt-2">
            Sipariş vererek puan kazanmaya başlayın!
          </p>
        </div>
      )}
    </div>
  );
};

export default LoyaltyProfile;