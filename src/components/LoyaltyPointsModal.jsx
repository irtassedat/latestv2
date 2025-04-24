import { useState, useEffect } from 'react';
import { FiStar, FiAlertCircle } from 'react-icons/fi';
import api from '../lib/axios';

const LoyaltyPointsModal = ({ 
  show, 
  onClose, 
  customer, 
  brandId, 
  orderTotal, 
  onPointsSelected 
}) => {
  const [availablePoints, setAvailablePoints] = useState(0);
  const [selectedPoints, setSelectedPoints] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pointRules, setPointRules] = useState({
    min_points_for_redemption: 100,
    points_to_currency_ratio: 0.01,
    max_discount_percentage: 50
  });

  useEffect(() => {
    if (show && customer && brandId) {
      fetchLoyaltyData();
    }
  }, [show, customer, brandId]);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('customer_token');
      
      // Müşterinin puan bilgilerini al
      const accountResponse = await api.get(`/api/loyalty/customer/${customer.id}/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAvailablePoints(accountResponse.data.current_points || 0);
      
      // Puan kullanım kurallarını al
      const settingsResponse = await api.get(`/api/loyalty/settings?brand_id=${brandId}`);
      if (settingsResponse.data.point_rules) {
        setPointRules(settingsResponse.data.point_rules);
      }
    } catch (err) {
      console.error('Sadakat bilgileri alınamadı:', err);
      setError('Sadakat bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handlePointsChange = (points) => {
    setError('');
    const pointsToUse = parseInt(points) || 0;
    
    if (pointsToUse > availablePoints) {
      setError('Yetersiz puan');
      return;
    }
    
    if (pointsToUse < pointRules.min_points_for_redemption && pointsToUse !== 0) {
      setError(`Minimum ${pointRules.min_points_for_redemption} puan kullanabilirsiniz`);
      return;
    }
    
    const calculatedDiscount = pointsToUse * pointRules.points_to_currency_ratio;
    const maxDiscount = orderTotal * (pointRules.max_discount_percentage / 100);
    
    if (calculatedDiscount > maxDiscount) {
      setError(`Maksimum indirim tutarı: ${maxDiscount.toFixed(2)} TL`);
      return;
    }
    
    setSelectedPoints(pointsToUse);
    setDiscount(calculatedDiscount);
  };

  const applyPoints = () => {
    if (selectedPoints === 0) {
      setError('Lütfen kullanmak istediğiniz puan miktarını girin');
      return;
    }
    
    if (!error) {
      onPointsSelected({
        points: selectedPoints,
        discount: discount
      });
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">Puan Kullan</h2>
          <p className="text-sm text-gray-500 mt-1">
            Siparişinizde puan kullanarak indirim kazanın
          </p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ) : (
          <>
            {/* Mevcut Puan */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiStar className="text-blue-600" />
                  <span className="font-medium">Kullanılabilir Puan</span>
                </div>
                <span className="text-xl font-bold text-blue-600">{availablePoints}</span>
              </div>
            </div>

            {/* Puan Girişi */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanmak istediğiniz puan miktarı
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={availablePoints}
                  value={selectedPoints || ''}
                  onChange={(e) => handlePointsChange(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Min: ${pointRules.min_points_for_redemption} - Max: ${availablePoints}`}
                />
                <button
                  onClick={() => handlePointsChange(availablePoints)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Tümünü Kullan
                </button>
              </div>
              
              {error && (
                <div className="mt-2 flex items-center gap-1 text-red-500 text-sm">
                  <FiAlertCircle />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* İndirim Hesaplama */}
            {selectedPoints > 0 && !error && (
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-green-800">İndirim Tutarı</p>
                    <p className="text-sm text-green-600">
                      {selectedPoints} puan = {discount.toFixed(2)} TL
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Yeni Toplam</p>
                    <p className="text-xl font-bold text-green-700">
                      {(orderTotal - discount).toFixed(2)} TL
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bilgi */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium mb-2">Puan Kullanım Kuralları</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Minimum {pointRules.min_points_for_redemption} puan kullanabilirsiniz</li>
                <li>• 1 puan = {pointRules.points_to_currency_ratio} TL değerindedir</li>
                <li>• Maksimum %{pointRules.max_discount_percentage} indirim uygulanabilir</li>
              </ul>
            </div>

            {/* Butonlar */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={applyPoints}
                disabled={selectedPoints === 0 || error}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Puan Kullan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoyaltyPointsModal;