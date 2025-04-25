// src/components/LoyaltyRewardsManager.jsx
import { useState, useEffect } from "react";
import { FiGift, FiPlus, FiEdit2, FiTrash2, FiImage, FiSettings } from "react-icons/fi";
import api from "../lib/axios";
import toast from "react-hot-toast";

const LoyaltyRewardsManager = () => {
  const [rewards, setRewards] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [rewardStats, setRewardStats] = useState({});

  const [form, setForm] = useState({
    brand_id: "",
    name: "",
    description: "",
    reward_type: "product",
    points_required: "",
    rules: {},
    image_url: "",
    is_active: true,
    is_limited: false,
    stock_limit: "",
    available_from: "",
    available_until: "",
    target_tiers: [],
    target_branches: []
  });

  const rewardTypes = [
    { value: 'product', label: 'Ürün', icon: '🛍️' },
    { value: 'discount', label: 'İndirim', icon: '🏷️' },
    { value: 'special_menu', label: 'Özel Menü', icon: '🍽️' },
    { value: 'milestone', label: 'Milestone', icon: '🏆' },
    { value: 'birthday', label: 'Doğum Günü', icon: '🎂' },
    { value: 'category_discount', label: 'Kategori İndirimi', icon: '📦' }
  ];

  const tierLevels = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

  useEffect(() => {
    fetchData();
  }, [selectedBrand]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rewardsRes, brandsRes] = await Promise.all([
        api.get("/api/loyalty/rewards", { params: { brand_id: selectedBrand || undefined } }),
        api.get("/api/brands?simple=true")
      ]);

      setRewards(rewardsRes.data);
      setBrands(brandsRes.data);

      // İstatistikleri sadece selectedBrand varsa getir
      if (selectedBrand) {
        const statsRes = await api.get("/api/loyalty/rewards/analytics", {
          params: { brand_id: selectedBrand }
        });

        const statsMap = {};
        statsRes.data.forEach(stat => {
          statsMap[stat.reward_id] = stat;
        });
        setRewardStats(statsMap);
      } else {
        setRewardStats({});
      }

    } catch (err) {
      console.error('Veriler yüklenirken hata:', err);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('rules.')) {
      const ruleKey = name.split('.')[1];
      setForm({
        ...form,
        rules: {
          ...form.rules,
          [ruleKey]: type === 'number' ? parseFloat(value) : value
        }
      });
    } else {
      setForm({
        ...form,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleAddEditReward = (reward = null) => {
    if (reward) {
      setEditingReward(reward);
      setForm({
        ...reward,
        available_from: reward.available_from?.split('T')[0] || "",
        available_until: reward.available_until?.split('T')[0] || ""
      });
    } else {
      setEditingReward(null);
      setForm({
        brand_id: selectedBrand,
        name: "",
        description: "",
        reward_type: "product",
        points_required: "",
        rules: {},
        image_url: "",
        is_active: true,
        is_limited: false,
        stock_limit: "",
        available_from: "",
        available_until: "",
        target_tiers: [],
        target_branches: []
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...form,
        // stock_limit için boş string yerine null veya undefined
        stock_limit: form.is_limited && form.stock_limit ? parseInt(form.stock_limit) : null,
        points_required: parseInt(form.points_required)
      };

      if (editingReward) {
        await api.put(`/api/loyalty/rewards/${editingReward.id}`, submitData);
        toast.success('Ödül güncellendi');
      } else {
        await api.post('/api/loyalty/rewards', submitData);
        toast.success('Ödül oluşturuldu');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Ödül kaydedilirken hata:', err);
      toast.error(err.response?.data?.error || 'İşlem başarısız');
    }
  };

  const handleDelete = async (rewardId) => {
    try {
      await api.delete(`/api/loyalty/rewards/${rewardId}`);
      toast.success('Ödül silindi');
      setConfirmDelete(null);
      fetchData();
    } catch (err) {
      console.error('Ödül silinirken hata:', err);
      toast.error('Ödül silinemedi');
    }
  };

  const renderRulesFields = () => {
    switch (form.reward_type) {
      case 'product':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün ID
              </label>
              <input
                type="number"
                name="rules.product_id"
                value={form.rules.product_id || ''}
                onChange={handleFormChange}
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miktar
              </label>
              <input
                type="number"
                name="rules.quantity"
                value={form.rules.quantity || ''}
                onChange={handleFormChange}
                className="w-full border rounded-lg p-2"
                min="1"
              />
            </div>
          </div>
        );

      case 'discount':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İndirim Yüzdesi
              </label>
              <input
                type="number"
                name="rules.discount_percentage"
                value={form.rules.discount_percentage || ''}
                onChange={handleFormChange}
                className="w-full border rounded-lg p-2"
                min="1"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maksimum İndirim Tutarı
              </label>
              <input
                type="number"
                name="rules.max_amount"
                value={form.rules.max_amount || ''}
                onChange={handleFormChange}
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>
        );

      case 'category_discount':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori ID
              </label>
              <input
                type="number"
                name="rules.category_id"
                value={form.rules.category_id || ''}
                onChange={handleFormChange}
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İndirim Yüzdesi
              </label>
              <input
                type="number"
                name="rules.discount_percentage"
                value={form.rules.discount_percentage || ''}
                onChange={handleFormChange}
                className="w-full border rounded-lg p-2"
                min="1"
                max="100"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-800">Ödül Yönetimi</h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="border rounded-lg p-2"
            >
              <option value="">Tüm Markalar</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            <button
              onClick={() => handleAddEditReward()}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <FiPlus />
              <span>Yeni Ödül</span>
            </button>
          </div>
        </div>

        {/* Ödül Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map(reward => {
            const stats = rewardStats[reward.id] || {};
            return (
              <div
                key={reward.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {reward.image_url && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={reward.image_url}
                      alt={reward.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {rewardTypes.find(t => t.value === reward.reward_type)?.icon}
                        {reward.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {rewardTypes.find(t => t.value === reward.reward_type)?.label}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${reward.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {reward.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{reward.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Gerekli Puan:</span>
                      <span className="font-bold text-blue-600">{reward.points_required}</span>
                    </div>

                    {reward.is_limited && (
                      <div className="flex justify-between text-sm">
                        <span>Stok:</span>
                        <span className={`font-bold ${reward.stock_remaining <= 5 ? 'text-red-600' : 'text-green-600'
                          }`}>
                          {reward.stock_remaining} / {reward.stock_limit}
                        </span>
                      </div>
                    )}

                    {stats.total_redemptions > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Kullanım:</span>
                        <span className="font-medium">{stats.total_redemptions} kez</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleAddEditReward(reward)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(reward.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ödül yoksa */}
        {rewards.length === 0 && (
          <div className="text-center py-12">
            <FiGift className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Henüz ödül yok</h3>
            <p className="text-gray-500">Yeni ödül ekleyerek başlayın</p>
          </div>
        )}

        {/* Ödül Ekleme/Düzenleme Modalı */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">
                    {editingReward ? 'Ödülü Düzenle' : 'Yeni Ödül'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Marka
                      </label>
                      <select
                        name="brand_id"
                        value={form.brand_id}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                        required
                      >
                        <option value="">Marka seçin</option>
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ödül Tipi
                      </label>
                      <select
                        name="reward_type"
                        value={form.reward_type}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                        required
                      >
                        {rewardTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ödül Adı
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gerekli Puan
                      </label>
                      <input
                        type="number"
                        name="points_required"
                        value={form.points_required}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                        required
                        min="1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Açıklama
                      </label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                        rows="3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Görsel URL
                      </label>
                      <input
                        type="url"
                        name="image_url"
                        value={form.image_url}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={form.is_active}
                          onChange={handleFormChange}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Aktif</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="is_limited"
                          checked={form.is_limited}
                          onChange={handleFormChange}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Stok Limiti</span>
                      </label>
                    </div>

                    {form.is_limited && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stok Limiti
                        </label>
                        <input
                          type="number"
                          name="stock_limit"
                          value={form.stock_limit}
                          onChange={handleFormChange}
                          className="w-full border rounded-lg p-2"
                          min="1"
                          required={form.is_limited}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Başlangıç Tarihi
                      </label>
                      <input
                        type="date"
                        name="available_from"
                        value={form.available_from}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        name="available_until"
                        value={form.available_until}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hedef Üyelik Seviyeleri
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {tierLevels.map(tier => (
                          <label key={tier} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={form.target_tiers.includes(tier)}
                              onChange={(e) => {
                                const newTiers = e.target.checked
                                  ? [...form.target_tiers, tier]
                                  : form.target_tiers.filter(t => t !== tier);
                                setForm({ ...form, target_tiers: newTiers });
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{tier}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Ödül Kuralları</h4>
                      {renderRulesFields()}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingReward ? 'Güncelle' : 'Oluştur'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Silme Onay Modalı */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Ödülü Sil</h3>
              <p className="text-gray-600 mb-6">
                Bu ödülü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoyaltyRewardsManager;