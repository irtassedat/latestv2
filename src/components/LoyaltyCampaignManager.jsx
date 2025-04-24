import { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiGift, FiCalendar } from "react-icons/fi";
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

const LoyaltyCampaignManager = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({
    brand_id: "",
    name: "",
    description: "",
    campaign_type: "welcome",
    rules: {
      points: 100,
      multiplier: 2,
      target_category_id: null,
      min_amount: 0
    },
    valid_from: "",
    valid_until: "",
    is_active: true,
    target_branches: [],
    target_tiers: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, brandsRes] = await Promise.all([
        api.get("/api/loyalty/campaigns"),
        api.get("/api/brands?simple=true")
      ]);
      setCampaigns(campaignsRes.data);
      setBrands(brandsRes.data);
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

  const handleAddEditCampaign = (campaign = null) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setForm({
        brand_id: campaign.brand_id,
        name: campaign.name,
        description: campaign.description,
        campaign_type: campaign.campaign_type,
        rules: campaign.rules,
        valid_from: campaign.valid_from.split('T')[0],
        valid_until: campaign.valid_until.split('T')[0],
        is_active: campaign.is_active,
        target_branches: campaign.target_branches || [],
        target_tiers: campaign.target_tiers || []
      });
    } else {
      setEditingCampaign(null);
      setForm({
        brand_id: "",
        name: "",
        description: "",
        campaign_type: "welcome",
        rules: {
          points: 100,
          multiplier: 2,
          target_category_id: null,
          min_amount: 0
        },
        valid_from: "",
        valid_until: "",
        is_active: true,
        target_branches: [],
        target_tiers: []
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCampaign) {
        await api.put(`/api/loyalty/campaigns/${editingCampaign.id}`, form);
        toast.success('Kampanya güncellendi');
      } else {
        await api.post('/api/loyalty/campaigns', form);
        toast.success('Kampanya oluşturuldu');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Kampanya kaydedilirken hata:', err);
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async (campaignId) => {
    try {
      await api.delete(`/api/loyalty/campaigns/${campaignId}`);
      toast.success('Kampanya silindi');
      setConfirmDelete(null);
      fetchData();
    } catch (err) {
      console.error('Kampanya silinirken hata:', err);
      toast.error('Kampanya silinemedi');
    }
  };

  const campaignTypes = [
    { value: 'welcome', label: 'Hoşgeldin Kampanyası' },
    { value: 'double_points', label: 'Çift Puan' },
    { value: 'category_bonus', label: 'Kategori Bonusu' },
    { value: 'birthday', label: 'Doğum Günü' },
    { value: 'referral', label: 'Referans' },
    { value: 'spending_goal', label: 'Harcama Hedefi' }
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
          <h1 className="text-2xl font-bold text-gray-800">Sadakat Kampanyaları</h1>
          <button
            onClick={() => handleAddEditCampaign()}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <FiPlus />
            <span>Yeni Kampanya</span>
          </button>
        </div>

        {/* Kampanya Listesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    <p className="text-sm text-gray-500">
                      {campaignTypes.find(t => t.value === campaign.campaign_type)?.label}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      campaign.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {campaign.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{campaign.description}</p>

                <div className="text-sm text-gray-500 space-y-1">
                  <div className="flex items-center gap-2">
                    <FiCalendar />
                    <span>
                      {new Date(campaign.valid_from).toLocaleDateString()} - 
                      {new Date(campaign.valid_until).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiGift />
                    <span>
                      {campaign.campaign_type === 'welcome' && `${campaign.rules.points} puan`}
                      {campaign.campaign_type === 'double_points' && `${campaign.rules.multiplier}x puan`}
                      {campaign.campaign_type === 'category_bonus' && `${campaign.rules.bonus_rate * 100}% bonus`}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => handleAddEditCampaign(campaign)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(campaign.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Kampanya yoksa */}
        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <FiGift className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Henüz kampanya yok</h3>
            <p className="text-gray-500">Yeni kampanya ekleyerek başlayın</p>
          </div>
        )}

        {/* Kampanya Ekleme/Düzenleme Modalı */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">
                    {editingCampaign ? 'Kampanyayı Düzenle' : 'Yeni Kampanya'}
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
                        Kampanya Tipi
                      </label>
                      <select
                        name="campaign_type"
                        value={form.campaign_type}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                        required
                      >
                        {campaignTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kampanya Adı
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

                    {/* Kampanya tipine göre dinamik alanlar */}
                    {form.campaign_type === 'welcome' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hoşgeldin Puanı
                        </label>
                        <input
                          type="number"
                          name="rules.points"
                          value={form.rules.points}
                          onChange={handleFormChange}
                          className="w-full border rounded-lg p-2"
                        />
                      </div>
                    )}

                    {form.campaign_type === 'double_points' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Puan Çarpanı
                        </label>
                        <input
                          type="number"
                          name="rules.multiplier"
                          value={form.rules.multiplier}
                          onChange={handleFormChange}
                          className="w-full border rounded-lg p-2"
                          step="0.1"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Başlangıç Tarihi
                      </label>
                      <input
                        type="date"
                        name="valid_from"
                        value={form.valid_from}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        name="valid_until"
                        value={form.valid_until}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={form.is_active}
                          onChange={handleFormChange}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Kampanya aktif</span>
                      </label>
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
                      {editingCampaign ? 'Güncelle' : 'Oluştur'}
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
              <h3 className="text-lg font-semibold mb-4">Kampanyayı Sil</h3>
              <p className="text-gray-600 mb-6">
                Bu kampanyayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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

export default LoyaltyCampaignManager;