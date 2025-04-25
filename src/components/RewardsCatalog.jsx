// src/components/RewardsCatalog.jsx
import { useState, useEffect } from 'react';
import { FiGift, FiLock, FiStar, FiClock } from 'react-icons/fi';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const RewardsCatalog = ({ customer, brandId, onRedeemSuccess }) => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchAvailableRewards();
  }, [customer, brandId]);

  const fetchAvailableRewards = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      const response = await api.get('/api/loyalty/customer/rewards', {
        params: { brand_id: brandId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRewards(response.data);
    } catch (err) {
      console.error('Ödüller yüklenemedi:', err);
      toast.error('Ödüller yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!selectedReward || redeeming) return;
    
    setRedeeming(true);
    try {
      const token = localStorage.getItem('customer_token');
      const response = await api.post('/api/loyalty/customer/redeem', {
        reward_id: selectedReward.reward_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Ödül başarıyla kullanıldı!');
      setShowRedeemModal(false);
      setSelectedReward(null);
      fetchAvailableRewards();
      
      if (onRedeemSuccess) {
        onRedeemSuccess(response.data);
      }
    } catch (err) {
      console.error('Ödül kullanım hatası:', err);
      toast.error(err.response?.data?.error || 'Ödül kullanılamadı');
    } finally {
      setRedeeming(false);
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

  if (loading) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Ödül Kataloğu</h2>
      
      {rewards.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <FiGift size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Henüz ödül yok</h3>
          <p className="text-gray-500 mt-2">
            Puan kazanmaya devam edin!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map((reward) => (
            <div
              key={reward.reward_id}
              className={`bg-white rounded-xl shadow-md overflow-hidden ${
                !reward.can_redeem ? 'opacity-75' : ''
              }`}
            >
              {reward.image_url && (
                <div className="h-40 bg-gray-200">
                  <img
                    src={reward.image_url}
                    alt={reward.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {getRewardTypeIcon(reward.reward_type)}
                      {reward.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {reward.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-amber-600 font-bold">
                      <FiStar className="w-4 h-4" />
                      {reward.points_required}
                    </div>
                    {reward.is_limited && (
                      <span className="text-xs text-gray-500 mt-1">
                        Stok: {reward.stock_remaining}
                      </span>
                    )}
                  </div>
                </div>

                {reward.can_redeem ? (
                  <button
                    onClick={() => {
                      setSelectedReward(reward);
                      setShowRedeemModal(true);
                    }}
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Kullan
                  </button>
                ) : (
                  <div className="mt-4">
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <FiLock />
                      {reward.reason || 'Kullanılamaz'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ödül Kullanım Modalı */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowRedeemModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="text-4xl mb-3">
                {getRewardTypeIcon(selectedReward.reward_type)}
              </div>
              <h3 className="text-xl font-bold">{selectedReward.name}</h3>
              <p className="text-gray-600 mt-2">{selectedReward.description}</p>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <span className="font-medium">Harcanacak Puan:</span>
                <span className="font-bold text-amber-600">
                  {selectedReward.points_required}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium mb-2">Kullanım Koşulları:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ödül kullanıldıktan sonra iptal edilemez</li>
                <li>• Puanlar hesabınızdan düşülecektir</li>
                {selectedReward.reward_type === 'product' && (
                  <li>• Ürün ödülü sepetinize eklenecektir</li>
                )}
                {selectedReward.reward_type === 'discount' && (
                  <li>• İndirim bir sonraki siparişinizde geçerli olacaktır</li>
                )}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRedeemModal(false)}
                className="flex-1 px-4 py-3 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {redeeming ? 'İşleniyor...' : 'Ödülü Kullan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsCatalog;