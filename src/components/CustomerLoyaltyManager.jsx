import { useState, useEffect } from "react";
import { FiUser, FiStar, FiActivity, FiGift, FiPhone, FiMail, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
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

const CustomerLoyaltyManager = () => {
  const [customers, setCustomers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterTier, setFilterTier] = useState("");

  const [transactionForm, setTransactionForm] = useState({
    transaction_type: "add",
    points: 0,
    description: "",
    brand_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customersRes, brandsRes] = await Promise.all([
        api.get("/api/loyalty/customers"),
        api.get("/api/brands?simple=true")
      ]);
      setCustomers(customersRes.data);
      setBrands(brandsRes.data);
    } catch (err) {
      console.error('Veriler yüklenirken hata:', err);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleManualTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/loyalty/manual-transaction', {
        customer_id: selectedCustomer.id,
        ...transactionForm
      });
      toast.success('Puan işlemi başarılı');
      setShowTransactionModal(false);
      fetchData();
    } catch (err) {
      console.error('Manuel işlem hatası:', err);
      toast.error('İşlem başarısız');
    }
  };

  const handleShowDetails = async (customer) => {
    try {
      const response = await api.get(`/api/loyalty/customers/${customer.id}/details`);
      setSelectedCustomer(response.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Müşteri detayları yüklenemedi:', err);
      toast.error('Detaylar yüklenemedi');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = !filterBrand || customer.brand_id?.toString() === filterBrand;
    const matchesTier = !filterTier || customer.tier_level === filterTier;

    return matchesSearch && matchesBrand && matchesTier;
  });

  const tierColors = {
    BRONZE: 'bg-amber-700 text-white',
    SILVER: 'bg-gray-400 text-white',
    GOLD: 'bg-yellow-500 text-white',
    PLATINUM: 'bg-gray-800 text-white'
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
          <h1 className="text-2xl font-bold text-gray-800">Müşteri Sadakat Yönetimi</h1>
        </div>

        {/* Filtreler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>
          
          <div>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">Tüm Markalar</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">Tüm Seviyeler</option>
              <option value="BRONZE">Bronze</option>
              <option value="SILVER">Silver</option>
              <option value="GOLD">Gold</option>
              <option value="PLATINUM">Platinum</option>
            </select>
          </div>

          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-600">
              {filteredCustomers.length} müşteri bulundu
            </span>
          </div>
        </div>

        {/* Müşteri Listesi */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İletişim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marka</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seviye</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Puan</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <FiUser className="text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.full_name || 'İsimsiz'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {customer.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      <FiPhone className="text-gray-400" />
                      {customer.phone_number}
                    </div>
                    {customer.email && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <FiMail className="text-gray-400" />
                        {customer.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.brand_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${tierColors[customer.tier_level] || 'bg-gray-100 text-gray-800'}`}>
                      {customer.tier_level || 'BRONZE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.current_points?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      Toplam: {customer.lifetime_points?.toLocaleString() || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleShowDetails(customer)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Detay
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowTransactionModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      Puan İşlemi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Müşteri yoksa */}
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <FiUser className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Müşteri bulunamadı</h3>
            <p className="text-gray-500">Arama kriterlerinize uygun müşteri yok</p>
          </div>
        )}

        {/* Manuel Puan İşlemi Modalı */}
        {showTransactionModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Manuel Puan İşlemi</h3>
                  <button
                    onClick={() => setShowTransactionModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <p className="font-medium">{selectedCustomer.full_name || selectedCustomer.phone_number}</p>
                  <p className="text-sm text-gray-500">Mevcut Puan: {selectedCustomer.current_points}</p>
                </div>

                <form onSubmit={handleManualTransaction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İşlem Tipi
                    </label>
                    <select
                      value={transactionForm.transaction_type}
                      onChange={(e) => setTransactionForm({...transactionForm, transaction_type: e.target.value})}
                      className="w-full border rounded-lg p-2"
                      required
                    >
                      <option value="add">Puan Ekle</option>
                      <option value="subtract">Puan Çıkar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puan Miktarı
                    </label>
                    <input
                      type="number"
                      value={transactionForm.points}
                      onChange={(e) => setTransactionForm({...transactionForm, points: parseInt(e.target.value)})}
                      className="w-full border rounded-lg p-2"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                      className="w-full border rounded-lg p-2"
                      rows="3"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowTransactionModal(false)}
                      className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      İşlemi Tamamla
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Müşteri Detay Modalı */}
        {showDetailsModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Müşteri Detayları</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Müşteri Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="font-medium mb-2">Kişisel Bilgiler</h4>
                    <div className="space-y-2">
                      <p><span className="text-gray-600">Ad Soyad:</span> {selectedCustomer.full_name || 'Belirtilmemiş'}</p>
                      <p><span className="text-gray-600">Telefon:</span> {selectedCustomer.phone_number}</p>
                      <p><span className="text-gray-600">E-posta:</span> {selectedCustomer.email || 'Belirtilmemiş'}</p>
                      <p><span className="text-gray-600">Doğum Tarihi:</span> {selectedCustomer.birth_date ? new Date(selectedCustomer.birth_date).toLocaleDateString() : 'Belirtilmemiş'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Sadakat Bilgileri</h4>
                    <div className="space-y-2">
                      <p><span className="text-gray-600">Marka:</span> {selectedCustomer.brand_name}</p>
                      <p><span className="text-gray-600">Seviye:</span> <span className={`px-2 py-1 text-xs rounded-full ${tierColors[selectedCustomer.tier_level]}`}>{selectedCustomer.tier_level}</span></p>
                      <p><span className="text-gray-600">Mevcut Puan:</span> {selectedCustomer.current_points}</p>
                      <p><span className="text-gray-600">Toplam Puan:</span> {selectedCustomer.lifetime_points}</p>
                    </div>
                  </div>
                </div>

                {/* Son İşlemler */}
                <h4 className="font-medium mb-4">Son Puan İşlemleri</h4>
                <div className="space-y-3">
                  {selectedCustomer.transactions?.map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.transaction_type === 'earn' ? 'bg-green-100 text-green-600' : 
                          transaction.transaction_type === 'spend' ? 'bg-red-100 text-red-600' : 
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {transaction.transaction_type === 'earn' ? <FiTrendingUp /> : 
                           transaction.transaction_type === 'spend' ? <FiTrendingDown /> : 
                           <FiActivity />}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        transaction.transaction_type === 'earn' ? 'text-green-600' : 
                        transaction.transaction_type === 'spend' ? 'text-red-600' : 
                        'text-blue-600'
                      }`}>
                        {transaction.transaction_type === 'spend' ? '-' : '+'}{transaction.points} puan
                      </div>
                    </div>
                  ))}
                  
                  {(!selectedCustomer.transactions || selectedCustomer.transactions.length === 0) && (
                    <p className="text-center text-gray-500 py-4">Henüz işlem yok</p>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerLoyaltyManager;