// src/components/RewardsHistory.jsx
import { useState, useEffect } from 'react';
import { FiGift, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '../lib/axios';

const RewardsHistory = ({ customer }) => {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRedemptionHistory();
  }, [customer]);

  const fetchRedemptionHistory = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      const response = await api.get('/api/loyalty/customer/redemptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRedemptions(response.data);
    } catch (err) {
      console.error('Ödül geçmişi yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="text-green-500" />;
      case 'pending':
        return <FiClock className="text-yellow-500" />;
      case 'cancelled':
      case 'expired':
        return <FiXCircle className="text-red-500" />;
      default:
        return <FiGift className="text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'pending': return 'Beklemede';
      case 'cancelled': return 'İptal Edildi';
      case 'expired': return 'Süresi Doldu';
      default: return status;
    }
  };

  const getRewardTypeIcon = (type) => {
    switch (type) {
      case 'product': return '🛍️';
      case 'discount': return '🏷️';
      case 'special_menu': return '🍽️';
      case 'milestone': return '🏆';
      case 'birthday': return '🎂';
      case 'category_discount': return '📦';
      default: return '🎁';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Ödül Kullanım Geçmişi</h2>
      
      {redemptions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <FiGift size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Henüz ödül kullanmadınız</h3>
          <p className="text-gray-500 mt-2">
            Kazandığınız puanları ödüllere dönüştürebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {redemptions.map((redemption) => (
            <div
              key={redemption.id}
              className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">
                  {getRewardTypeIcon(redemption.reward_type)}
                </div>
                <div>
                  <h3 className="font-bold">{redemption.reward_name}</h3>
                  <p className="text-sm text-gray-600">{redemption.reward_description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{formatDate(redemption.redemption_date)}</span>
                    {redemption.brand_name && (
                      <span>• {redemption.brand_name}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-amber-600 font-bold">
                  <FiGift className="w-4 h-4" />
                  {redemption.points_spent} puan
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {getStatusIcon(redemption.redemption_status)}
                  <span className="text-sm">
                    {getStatusText(redemption.redemption_status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RewardsHistory;