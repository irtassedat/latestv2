import { useState, useEffect } from "react";
import api from "../lib/axios";
import toast from "react-hot-toast";

const BranchPointsTransfer = () => {
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [branches, setBranches] = useState([]);
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerLoyaltyAccount, setCustomerLoyaltyAccount] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);

  // Markaları yükle
  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await api.get("/api/brands?simple=true");
      setBrands(response.data);
    } catch (err) {
      console.error("Markalar yüklenemedi:", err);
      toast.error("Markalar yüklenemedi");
    }
  };

  // Seçili markaya göre şubeleri yükle
  useEffect(() => {
    if (selectedBrand) {
      fetchBranches(selectedBrand);
    } else {
      setBranches([]);
      setFromBranch("");
      setToBranch("");
    }
  }, [selectedBrand]);

  const fetchBranches = async (brandId) => {
    try {
      const response = await api.get(`/api/brands/${brandId}/branches?simple=true`);
      setBranches(response.data);
    } catch (err) {
      console.error("Şubeler yüklenemedi:", err);
      toast.error("Şubeler yüklenemedi");
    }
  };

  const handleCustomerSearch = async () => {
    if (customerSearch.length < 3) {
      toast.error("En az 3 karakter girmelisiniz");
      return;
    }

    try {
      const response = await api.get('/api/loyalty/customers', {
        params: { search: customerSearch }
      });
      setSearchResults(response.data);
    } catch (err) {
      console.error("Müşteri arama hatası:", err);
      toast.error("Müşteri araması başarısız");
    }
  };

  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setSearchResults([]);
    setCustomerSearch("");
    
    // Müşterinin markaya ait sadakat hesabını yükle
    if (selectedBrand) {
      await fetchCustomerLoyaltyAccount(customer.id, selectedBrand);
    }
  };

  const fetchCustomerLoyaltyAccount = async (customerId, brandId) => {
    try {
      const response = await api.get(`/api/loyalty/customer/${customerId}/accounts/${brandId}`);
      setCustomerLoyaltyAccount(response.data);
    } catch (err) {
      setCustomerLoyaltyAccount(null);
      if (err.response?.status === 404) {
        toast.error("Müşterinin bu markada sadakat hesabı bulunmuyor");
      } else {
        toast.error("Sadakat hesabı bilgileri alınamadı");
      }
    }
  };

  // Marka değiştiğinde sadakat hesabını güncelle
  useEffect(() => {
    if (selectedCustomer && selectedBrand) {
      fetchCustomerLoyaltyAccount(selectedCustomer.id, selectedBrand);
    } else {
      setCustomerLoyaltyAccount(null);
    }
  }, [selectedBrand, selectedCustomer]);

  const handleTransfer = async () => {
    if (!selectedCustomer || !selectedBrand || !fromBranch || !toBranch || !pointsAmount) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    if (fromBranch === toBranch) {
      toast.error("Aynı şubeler arasında transfer yapılamaz");
      return;
    }

    if (!customerLoyaltyAccount || customerLoyaltyAccount.current_points < parseInt(pointsAmount)) {
      toast.error("Yetersiz puan");
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/loyalty/branch-transfer', {
        customer_id: selectedCustomer.id,
        brand_id: selectedBrand,
        from_branch_id: fromBranch,
        to_branch_id: toBranch,
        points_amount: parseInt(pointsAmount),
        transfer_reason: "Şube değişikliği"
      });

      toast.success("Transfer başarıyla tamamlandı");
      clearForm();
      fetchTransferHistory();
    } catch (err) {
      console.error("Transfer hatası:", err);
      toast.error(err.response?.data?.error || "Transfer yapılamadı");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransferHistory = async () => {
    try {
      const response = await api.get('/api/loyalty/transfer-history', {
        params: { limit: 10 }
      });
      setTransferHistory(response.data);
    } catch (err) {
      console.error("Transfer geçmişi yüklenemedi:", err);
    }
  };

  useEffect(() => {
    fetchTransferHistory();
  }, []);

  const clearForm = () => {
    setSelectedCustomer(null);
    setSelectedBrand("");
    setFromBranch("");
    setToBranch("");
    setPointsAmount("");
    setCustomerLoyaltyAccount(null);
    setCustomerSearch("");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Şubeler Arası Puan Transferi</h1>
          <p className="text-gray-600 mt-1">Aynı markaya ait şubeler arasında müşteri puanı transfer edin</p>
        </div>

        {/* Müşteri Arama */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Müşteri Seç</h2>
          
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Telefon numarası veya isim ile ara..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                className="w-full border rounded-lg p-2 pl-10"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <button
              onClick={handleCustomerSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ara
            </button>
          </div>

          {/* Arama Sonuçları */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              {searchResults.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{customer.full_name || 'İsimsiz'}</p>
                      <p className="text-sm text-gray-600">{customer.phone_number}</p>
                    </div>
                    <span className="text-sm text-gray-500">ID: {customer.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Seçili Müşteri */}
          {selectedCustomer && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedCustomer.full_name || 'İsimsiz'}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.phone_number}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerLoyaltyAccount(null);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Değiştir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transfer Formu */}
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Marka Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marka
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setFromBranch("");
                  setToBranch("");
                }}
                className="w-full border rounded-lg p-2"
              >
                <option value="">Marka seçin</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            {/* Mevcut Puan Bilgisi */}
            {selectedBrand && customerLoyaltyAccount && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Mevcut Puan Durumu</h3>
                <div className="flex justify-between items-center">
                  <span>{customerLoyaltyAccount.brand_name}</span>
                  <span className="font-bold text-blue-600">{customerLoyaltyAccount.current_points} puan</span>
                </div>
              </div>
            )}

            {/* Şube Seçimi */}
            {selectedBrand && customerLoyaltyAccount && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kaynak Şube
                  </label>
                  <select
                    value={fromBranch}
                    onChange={(e) => setFromBranch(e.target.value)}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Şube seçin</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hedef Şube
                  </label>
                  <select
                    value={toBranch}
                    onChange={(e) => setToBranch(e.target.value)}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Şube seçin</option>
                    {branches
                      .filter(branch => branch.id !== parseInt(fromBranch))
                      .map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Puan Miktarı */}
            {fromBranch && toBranch && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer Edilecek Puan
                </label>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  min="1"
                  max={customerLoyaltyAccount?.current_points || 0}
                />
              </div>
            )}

            {/* Transfer Özeti */}
            {fromBranch && toBranch && pointsAmount && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <h3 className="font-medium mb-2">Transfer Özeti</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{branches.find(b => b.id === parseInt(fromBranch))?.name}</p>
                    <p className="text-sm text-gray-600">Kaynak Şube</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>→</span>
                    <span className="font-bold text-amber-600">{pointsAmount} puan</span>
                    <span>→</span>
                  </div>
                  <div>
                    <p className="font-medium">{branches.find(b => b.id === parseInt(toBranch))?.name}</p>
                    <p className="text-sm text-gray-600">Hedef Şube</p>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Butonu */}
            <div className="flex justify-end gap-3">
              <button
                onClick={clearForm}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleTransfer}
                disabled={loading || !fromBranch || !toBranch || !pointsAmount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Transfer Yapılıyor...' : 'Transferi Tamamla'}
              </button>
            </div>
          </div>
        )}

        {/* Transfer Geçmişi */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Son Transfer İşlemleri</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marka</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Şube</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Puan</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tarih</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transferHistory.map((transfer) => (
                  <tr key={transfer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transfer.customer_name}</div>
                      <div className="text-sm text-gray-500">{transfer.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transfer.brand_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transfer.branch_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transfer.transaction_type === 'transfer_in' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transfer.transaction_type === 'transfer_in' ? 'Gelen' : 'Giden'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {transfer.points}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {new Date(transfer.created_at).toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Uyarı */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
          <span className="text-blue-600 text-xl">ℹ️</span>
          <div>
            <h4 className="font-medium text-blue-900">Önemli Bilgiler</h4>
            <ul className="text-sm text-blue-700 mt-1 list-disc pl-4">
              <li>Sadece aynı markaya ait şubeler arasında transfer yapılabilir</li>
              <li>Transfer işlemi geri alınamaz</li>
              <li>Müşterinin mevcut puanı transfer edilecek miktardan fazla olmalıdır</li>
              <li>Transfer işlemi kaydedilir ve raporlanır</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchPointsTransfer;