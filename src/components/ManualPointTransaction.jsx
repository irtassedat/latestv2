import { useState, useEffect } from "react";
import { FiSearch, FiStar, FiUserCheck, FiArrowUp, FiArrowDown } from "react-icons/fi";
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

const ManualPointTransaction = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    transaction_type: "add",
    points: "",
    description: "",
    brand_id: ""
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await api.get("/api/brands?simple=true");
      setBrands(response.data);
    } catch (err) {
      console.error('Markalar yüklenirken hata:', err);
      toast.error('Markalar yüklenemedi');
    }
  };

  const searchCustomers = async () => {
    if (searchTerm.length < 3) {
      toast.error('En az 3 karakter girmelisiniz');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/api/loyalty/customers/search', {
        params: { q: searchTerm }
      });
      setSearchResults(response.data);
    } catch (err) {
      console.error('Müşteri arama hatası:', err);
      toast.error('Müşteri araması başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSearchResults([]);
    setSearchTerm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error('Lütfen bir müşteri seçin');
      return;
    }

    if (!form.brand_id) {
      toast.error('Lütfen bir marka seçin');
      return;
    }

    if (!form.points || parseInt(form.points) <= 0) {
      toast.error('Geçerli bir puan miktarı girin');
      return;
    }

    if (!form.description) {
      toast.error('Açıklama alanı gereklidir');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/loyalty/manual-transaction', {
        customer_id: selectedCustomer.id,
        ...form,
        points: parseInt(form.points)
      });

      toast.success('Puan işlemi başarıyla tamamlandı');
      
      // Formu sıfırla
      setSelectedCustomer(null);
      setForm({
        transaction_type: "add",
        points: "",
        description: "",
        brand_id: ""
      });
    } catch (err) {
      console.error('Manuel işlem hatası:', err);
      toast.error('İşlem başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Manuel Puan İşlemi</h1>

        {/* Müşteri Arama */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Müşteri Seç</h2>
          
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Telefon numarası veya isim ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded-lg p-2 pl-10"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <button
              onClick={searchCustomers}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                  onClick={() => handleCustomerSelect(customer)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{customer.full_name || 'İsimsiz'}</p>
                      <p className="text-sm text-gray-600">{customer.phone_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{customer.current_points || 0} puan</p>
                      <p className="text-xs text-gray-500">{customer.tier_level || 'BRONZE'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Seçili Müşteri */}
          {selectedCustomer && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiUserCheck className="text-blue-600" size={24} />
                  <div>
                    <p className="font-medium">{selectedCustomer.full_name || 'İsimsiz'}</p>
                    <p className="text-sm text-gray-600">{selectedCustomer.phone_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  Değiştir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* İşlem Formu */}
        {selectedCustomer && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marka
                </label>
                <select
                  value={form.brand_id}
                  onChange={(e) => setForm({...form, brand_id: e.target.value})}
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
                  İşlem Tipi
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="transaction_type"
                      value="add"
                      checked={form.transaction_type === "add"}
                      onChange={(e) => setForm({...form, transaction_type: e.target.value})}
                      className="text-green-600"
                    />
                    <span className="flex items-center gap-1">
                      <FiArrowUp className="text-green-600" />
                      Puan Ekle
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="transaction_type"
                      value="subtract"
                      checked={form.transaction_type === "subtract"}
                      onChange={(e) => setForm({...form, transaction_type: e.target.value})}
                      className="text-red-600"
                    />
                    <span className="flex items-center gap-1">
                      <FiArrowDown className="text-red-600" />
                      Puan Çıkar
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puan Miktarı
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.points}
                    onChange={(e) => setForm({...form, points: e.target.value})}
                    className="w-full border rounded-lg p-2 pl-10"
                    min="1"
                    required
                  />
                  <FiStar className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full border rounded-lg p-2"
                  rows="3"
                  placeholder="İşlem açıklamasını girin (örn: Manuel puan düzeltmesi, Özel promosyon puanı)"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setForm({
                    transaction_type: "add",
                    points: "",
                    description: "",
                    brand_id: ""
                  });
                }}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'İşleniyor...' : 'İşlemi Tamamla'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManualPointTransaction;