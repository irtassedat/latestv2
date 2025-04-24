import { useState, useEffect } from "react";
import { FiSettings, FiSave, FiStar, FiAward, FiPercent, FiAlertCircle } from "react-icons/fi";
import api from "../lib/axios";
import toast from "react-hot-toast";

// Çeşme Kahvecisi tema renkleri
const theme = {
  primary: "#022B45",
  secondary: "#B8D7DD",
  accent: "#D98A3D",
  light: "#F4F7F8",
  success: "#28a745",
  danger: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
};

const LoyaltySettingsManager = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    points_per_currency: 1,
    currency_multiplier: 1,
    welcome_points: 100,
    birthday_points: 200,
    referral_points: 500,
    min_points_for_redemption: 100,
    points_expiry_months: 12,
    enable_double_points: true,
    double_points_days: [],
    enable_tiers: true,
    tier_rules: {
      BRONZE: { min_points: 0, benefits: ["Temel avantajlar"] },
      SILVER: { min_points: 1000, benefits: ["Özel indirimler", "Promosyon günlerinde ekstra puan"] },
      GOLD: { min_points: 5000, benefits: ["VIP müşteri hizmeti", "Ücretsiz içecek hakkı"] },
      PLATINUM: { min_points: 10000, benefits: ["Özel etkinliklere davet", "Ücretsiz doğum günü menüsü"] }
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/loyalty/settings");
      setSettings(response.data);
    } catch (err) {
      console.error('Ayarlar yüklenirken hata:', err);
      toast.error('Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/loyalty/settings', settings);
      toast.success('Ayarlar kaydedildi');
    } catch (err) {
      console.error('Ayarlar kaydedilirken hata:', err);
      toast.error('Ayarlar kaydedilemedi');
    }
  };

  const handleNumberChange = (field, value) => {
    setSettings({
      ...settings,
      [field]: parseFloat(value) || 0
    });
  };

  const handleTierChange = (tier, field, value) => {
    setSettings({
      ...settings,
      tier_rules: {
        ...settings.tier_rules,
        [tier]: {
          ...settings.tier_rules[tier],
          [field]: field === 'min_points' ? parseInt(value) : value
        }
      }
    });
  };

  const handleBenefitChange = (tier, index, value) => {
    const newBenefits = [...settings.tier_rules[tier].benefits];
    newBenefits[index] = value;
    handleTierChange(tier, 'benefits', newBenefits);
  };

  const addBenefit = (tier) => {
    const newBenefits = [...settings.tier_rules[tier].benefits, ""];
    handleTierChange(tier, 'benefits', newBenefits);
  };

  const removeBenefit = (tier, index) => {
    const newBenefits = settings.tier_rules[tier].benefits.filter((_, i) => i !== index);
    handleTierChange(tier, 'benefits', newBenefits);
  };

  const weekDays = [
    { value: 0, label: 'Pazar' },
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Sadakat Programı Ayarları</h1>
        </div>

        {/* Tab Menü */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("general")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "general"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Genel Ayarlar
            </button>
            <button
              onClick={() => setActiveTab("tiers")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tiers"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Üyelik Seviyeleri
            </button>
            <button
              onClick={() => setActiveTab("rewards")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "rewards"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Ödül Ayarları
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Genel Ayarlar */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    1 TL = X Puan
                  </label>
                  <input
                    type="number"
                    value={settings.points_per_currency}
                    onChange={(e) => handleNumberChange('points_per_currency', e.target.value)}
                    className="w-full border rounded-lg p-2"
                    min="0"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Her 1 TL harcama için kazanılacak puan miktarı</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hoşgeldin Puanı
                  </label>
                  <input
                    type="number"
                    value={settings.welcome_points}
                    onChange={(e) => handleNumberChange('welcome_points', e.target.value)}
                    className="w-full border rounded-lg p-2"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Yeni üyelere verilecek puan</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doğum Günü Puanı
                  </label>
                  <input
                    type="number"
                    value={settings.birthday_points}
                    onChange={(e) => handleNumberChange('birthday_points', e.target.value)}
                    className="w-full border rounded-lg p-2"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Doğum gününde verilecek puan</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referans Puanı
                  </label>
                  <input
                    type="number"
                    value={settings.referral_points}
                    onChange={(e) => handleNumberChange('referral_points', e.target.value)}
                    className="w-full border rounded-lg p-2"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Arkadaş davet etme için verilecek puan</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Kullanım Puanı
                  </label>
                  <input
                    type="number"
                    value={settings.min_points_for_redemption}
                    onChange={(e) => handleNumberChange('min_points_for_redemption', e.target.value)}
                    className="w-full border rounded-lg p-2"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Puanların kullanılmaya başlanacağı minimum miktar</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puan Geçerlilik Süresi (Ay)
                  </label>
                  <input
                    type="number"
                    value={settings.points_expiry_months}
                    onChange={(e) => handleNumberChange('points_expiry_months', e.target.value)}
                    className="w-full border rounded-lg p-2"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Puanların geçerli olacağı süre (0 = süresiz)</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Çift Puan Günleri</h3>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="enable_double_points"
                    checked={settings.enable_double_points}
                    onChange={(e) => setSettings({...settings, enable_double_points: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="enable_double_points" className="ml-2 text-sm text-gray-700">
                    Çift puan günlerini aktif et
                  </label>
                </div>

                {settings.enable_double_points && (
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map(day => (
                      <label key={day.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.double_points_days.includes(day.value)}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...settings.double_points_days, day.value]
                              : settings.double_points_days.filter(d => d !== day.value);
                            setSettings({...settings, double_points_days: newDays});
                          }}
                          className="rounded"
                        />
                        <span className="ml-2 text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Üyelik Seviyeleri */}
          {activeTab === "tiers" && (
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="enable_tiers"
                  checked={settings.enable_tiers}
                  onChange={(e) => setSettings({...settings, enable_tiers: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="enable_tiers" className="ml-2 text-sm text-gray-700">
                  Üyelik seviyelerini aktif et
                </label>
              </div>

              {settings.enable_tiers && (
                <div className="space-y-6">
                  {Object.entries(settings.tier_rules).map(([tier, rules]) => (
                    <div key={tier} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">{tier}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          tier === 'BRONZE' ? 'bg-amber-700 text-white' :
                          tier === 'SILVER' ? 'bg-gray-400 text-white' :
                          tier === 'GOLD' ? 'bg-yellow-500 text-white' :
                          'bg-gray-800 text-white'
                        }`}>
                          {rules.min_points}+ puan
                        </span>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Puan
                        </label>
                        <input
                          type="number"
                          value={rules.min_points}
                          onChange={(e) => handleTierChange(tier, 'min_points', e.target.value)}
                          className="w-full border rounded-lg p-2"
                          min="0"
                          disabled={tier === 'BRONZE'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Faydalar
                        </label>
                        {rules.benefits.map((benefit, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={benefit}
                              onChange={(e) => handleBenefitChange(tier, index, e.target.value)}
                              className="flex-1 border rounded-lg p-2"
                            />
                            <button
                              type="button"
                              onClick={() => removeBenefit(tier, index)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addBenefit(tier)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Fayda Ekle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ödül Ayarları */}
          {activeTab === "rewards" && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Bu bölüm geliştirme aşamasındadır. Yakında ödül tanımlama ve puan harcama kuralları eklenecektir.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-center text-gray-500">Ödül ayarları yakında eklenecek...</p>
            </div>
          )}

          {/* Kaydet Butonu */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiSave />
              Ayarları Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoyaltySettingsManager;