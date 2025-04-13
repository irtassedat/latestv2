import { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiMapPin, FiPhone, FiMail, FiHome, FiInfo, FiPackage, FiBriefcase } from "react-icons/fi";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Çeşme Kahvecisi tema renkleri
const theme = {
  primary: "#022B45",      // Koyu mavi
  secondary: "#B8D7DD",    // Açık mavi
  accent: "#D98A3D",       // Amber/Turuncu
  light: "#F4F7F8",        // Açık gri
  dark: "#343a40",         // Koyu gri
  success: "#28a745",      // Yeşil
  danger: "#dc3545",       // Kırmızı
  warning: "#ffc107",      // Sarı
  info: "#17a2b8",         // Bilgi rengi
  white: "#ffffff",        // Beyaz
  textPrimary: "#495057",  // Ana metin rengi
  textSecondary: "#6c757d" // İkincil metin rengi
};

const BrandManager = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    contact_email: "",
    contact_phone: "",
    address: "",

    description: "",
    is_active: true
  });

  // Markaları getir
  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/brands");
      setBrands(response.data);
    } catch (error) {
      console.error("Markalar yüklenirken hata:", error);
      toast.error("Markalar yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Form değişikliklerini izle
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Checkbox için checked değerini, diğerleri için value değerini kullan
    const inputValue = type === 'checkbox' ? checked : value;
    
    setForm({ ...form, [name]: inputValue });
  };

  // Marka ekleme/düzenleme modalını aç
  const handleAddEditBrand = (brand = null) => {
    if (brand) {
      // Düzenleme modu
      setEditingBrand(brand);
      setForm({
        name: brand.name || "",
        logo_url: brand.logo_url || "",
        contact_email: brand.contact_email || "",
        contact_phone: brand.contact_phone || "",
        address: brand.address || "",
        description: brand.description || "",
        is_active: brand.is_active !== false // undefined veya null ise true kabul et
      });
    } else {
      // Ekleme modu
      setEditingBrand(null);
      setForm({
        name: "",
        logo_url: "",
        contact_email: "",
        contact_phone: "",
        address: "",
        description: "",
        is_active: true
      });
    }
    
    setShowModal(true);
  };

  // Form gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (editingBrand) {
        // Var olan markayı güncelle
        response = await api.put(`/api/brands/${editingBrand.id}`, form);
        toast.success(`${form.name} markası başarıyla güncellendi`);
      } else {
        // Yeni marka ekle
        response = await api.post("/api/brands", form);
        toast.success(`${form.name} markası başarıyla eklendi`);
      }
      
      // Markaları yeniden yükle
      fetchBrands();
      
      // Modalı kapat
      setShowModal(false);
      
    } catch (error) {
      console.error("Form gönderilirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };

  // Marka silme işlemi
  const handleDelete = async (brandId) => {
    try {
      await api.delete(`/api/brands/${brandId}`);
      
      // Markaları güncelle
      setBrands(brands.filter(brand => brand.id !== brandId));
      
      toast.success("Marka başarıyla silindi");
      setConfirmDelete(null); // Silme onay penceresini kapat
    } catch (error) {
      console.error("Marka silinirken hata:", error);
      toast.error("Marka silinemedi!");
    }
  };

  // Şubelere git
  const handleViewBranches = (brandId) => {
    navigate(`/admin/brands/${brandId}/branches`);
  };

  // Filtreleme işlemleri
  const filteredBrands = brands.filter(brand => {
    return (
      brand.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>Marka Yönetimi</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Arama kutusu */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Marka ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none"
                style={{ 
                  borderColor: "rgba(2, 43, 69, 0.2)",
                  boxShadow: "0 1px 3px rgba(2, 43, 69, 0.1)"
                }}
              />
              <HiOutlineDocumentSearch 
                className="absolute left-2 top-2.5" 
                size={20} 
                style={{ color: theme.primary }} 
              />
            </div>
            
            {/* Yeni Marka Ekle butonu */}
            <button
              onClick={() => handleAddEditBrand()}
              className="flex items-center justify-center gap-1 px-4 py-2 text-white rounded-lg transition-colors"
              style={{ 
                backgroundColor: theme.accent,
                fontWeight: 600
              }}
            >
              <FiPlus size={18} />
              <span>Yeni Marka Ekle</span>
            </button>
          </div>
        </div>
        
        {/* Marka Listesi */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
              style={{ borderColor: theme.primary }}
            ></div>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div 
            className="rounded-lg p-8 text-center"
            style={{ backgroundColor: theme.light }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 mx-auto mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              style={{ color: theme.textSecondary }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
              />
            </svg>
            <h3 
              className="text-lg font-medium mb-2" 
              style={{ color: theme.primary }}
            >
              Marka Bulunamadı
            </h3>
            <p 
              className="mb-4" 
              style={{ color: theme.textSecondary }}
            >
              {searchTerm ? "Arama kriterlerinize uygun marka bulunmamaktadır." : "Henüz hiç marka eklenmemiş."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: theme.primary }}
              >
                Aramayı Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map(brand => (
              <div 
                key={brand.id} 
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}
              >
                <div 
                  className="h-40 relative overflow-hidden"
                >
                  {brand.logo_url ? (
                    <img 
                      src={brand.logo_url} 
                      alt={brand.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/logos/default-logo.png";
                      }}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-2xl font-bold" 
                      style={{ backgroundColor: theme.light }}
                    >
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent">
                    <div className="text-white p-4 w-full">
                      <h3 className="font-bold text-xl truncate">{brand.name}</h3>
                      <p className="text-sm text-white/80 truncate">{brand.address}</p>
                    </div>
                  </div>
                </div>
                
                
                <div className="p-4">
                  {brand.contact_email && (
                    <div className="flex items-center gap-2 mb-2">
                      <FiMail style={{ color: theme.accent }} size={16} />
                      <p 
                        className="text-sm truncate"
                        style={{ color: theme.textPrimary }}
                      >
                        {brand.contact_email}
                      </p>
                    </div>
                  )}
                  
                  {brand.contact_phone && (
                    <div className="flex items-center gap-2 mb-2">
                      <FiPhone style={{ color: theme.accent }} size={16} />
                      <p 
                        className="text-sm"
                        style={{ color: theme.textPrimary }}
                      >
                        {brand.contact_phone}
                      </p>
                    </div>
                  )}
                  
                  {brand.description && (
                    <div className="flex items-start gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}>
                      <FiInfo style={{ color: theme.accent }} className="mt-0.5 flex-shrink-0" size={16} />
                      <p 
                        className="text-sm line-clamp-2"
                        style={{ color: theme.textSecondary }}
                      >
                        {brand.description}
                      </p>
                    </div>
                  )}
                </div>
                
                <div 
                  className="grid grid-cols-3 border-t"
                  style={{ backgroundColor: theme.light, borderColor: "rgba(2, 43, 69, 0.1)" }}
                >
                  <button
                    onClick={() => handleAddEditBrand(brand)}
                    className="flex flex-col items-center justify-center py-3 hover:bg-gray-200 transition-colors"
                  >
                    <FiEdit2 size={18} style={{ color: theme.primary }} />
                    <span className="text-xs mt-1" style={{ color: theme.textSecondary }}>Düzenle</span>
                  </button>
                  
                  <button
                    onClick={() => handleViewBranches(brand.id)}
                    className="flex flex-col items-center justify-center py-3 hover:bg-gray-200 transition-colors"
                  >
                    <FiHome size={18} style={{ color: theme.accent }} />
                    <span className="text-xs mt-1" style={{ color: theme.textSecondary }}>Şubeler</span>
                  </button>
                  
                  <button
                    onClick={() => setConfirmDelete(brand.id)}
                    className="flex flex-col items-center justify-center py-3 hover:bg-gray-200 transition-colors"
                  >
                    <FiTrash2 size={18} style={{ color: theme.danger }} />
                    <span className="text-xs mt-1" style={{ color: theme.textSecondary }}>Sil</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Marka Ekleme/Düzenleme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" }}
          >
            <div 
              className="flex justify-between items-center p-4"
              style={{ borderBottom: `1px solid ${theme.secondary}` }}
            >
              <h3 
                className="text-xl font-semibold"
                style={{ color: theme.primary }}
              >
                {editingBrand ? `${editingBrand.name} Markasını Düzenle` : "Yeni Marka Ekle"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary }}
                  >
                    Marka Adı *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary
                    }}
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary }}
                  >
                    Logo URL
                  </label>
                  <input
                    type="text"
                    name="logo_url"
                    value={form.logo_url}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary
                    }}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary }}
                  >
                    E-posta
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={form.contact_email}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary
                    }}
                  />
                </div>
                
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary }}
                  >
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={form.contact_phone}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary
                    }}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary }}
                  >
                    Adres
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleFormChange}
                    rows="2"
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary
                    }}
                  ></textarea>
                </div>
                
                <div className="md:col-span-2">
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary }}
                  >
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary
                    }}
                  ></textarea>
                </div>
                
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleFormChange}
                      className="h-4 w-4 rounded focus:ring-0 border-2"
                      style={{ 
                        borderColor: theme.secondary,
                        accentColor: theme.accent
                      }}
                    />
                    <label 
                      htmlFor="is_active" 
                      className="ml-2 text-sm font-medium"
                      style={{ 
                        color: theme.primary
                      }}
                    >
                      Marka aktif
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ 
                    borderColor: theme.secondary,
                    color: theme.primary,
                    fontWeight: 600,
                    backgroundColor: theme.light
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{ 
                    backgroundColor: theme.accent,
                    color: theme.primary,
                    fontWeight: 600,
                    boxShadow: "0 2px 4px rgba(217, 138, 61, 0.3)"
                  }}
                >
                  {editingBrand ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Silme Onay Modalı */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            style={{ boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" }}
          >
            <div className="text-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 mx-auto mb-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                style={{ color: theme.danger }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
              
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: theme.primary }}
              >
                Markayı Sil
              </h3>
              <p 
                className="mb-6"
                style={{ color: theme.textSecondary }}
              >
                Bu markayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve markaya bağlı tüm şubeler de etkilenebilir.
              </p>
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ 
                    borderColor: theme.secondary,
                    color: theme.primary,
                    fontWeight: 600,
                    backgroundColor: theme.light
                  }}
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{ 
                    backgroundColor: theme.danger,
                    fontWeight: 600,
                    color: theme.primary
                  }}
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Çeşme Kahvecisi font ailesi için */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap');
        `}
      </style>
    </div>
  );
};

export default BrandManager;