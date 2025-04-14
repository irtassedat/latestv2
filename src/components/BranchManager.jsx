import { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiMapPin, FiPhone, FiMail, FiHome, FiInfo, FiBriefcase, FiFilter } from "react-icons/fi";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";

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

const BranchManager = () => {
  const { brandId } = useParams(); // URL'den marka ID'sini al
  const navigate = useNavigate();
  
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState(brandId || "");
  const [selectedView, setSelectedView] = useState("grid"); // "grid" veya "table"
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    manager_name: "",
    opening_hours: "",
    description: "",
    brand_id: "",
    is_active: true
  });

  // Markaları getir
  const fetchBrands = async () => {
    try {
      const response = await api.get("/api/brands?simple=true");
      setBrands(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Markalar yüklenirken hata:", error);
      toast.error("Markalar yüklenemedi!");
    }
  };

  // Tüm şubeleri getir
  const fetchAllBranches = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/branches");
      setBranches(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Şubeler yüklenirken hata:", error);
      toast.error("Şubeler yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  // Markaya göre şubeleri getir
  const fetchBranchesByBrand = async (brandId) => {
    if (!brandId) {
      return fetchAllBranches();
    }
    
    setLoading(true);
    try {
      const response = await api.get(`/api/brands/${brandId}/branches?simple=true`);
      
      // API yanıtının yapısını kontrol et
      let branchesArray = [];
      if (Array.isArray(response.data)) {
        branchesArray = response.data;
      } else if (response.data && response.data.branches && Array.isArray(response.data.branches)) {
        branchesArray = response.data.branches;
      }
      
      setBranches(branchesArray);
    } catch (error) {
      console.error("Markaya ait şubeler yüklenirken hata:", error);
      toast.error("Şubeler yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  // Sayfa ilk yüklendiğinde
  useEffect(() => {
    fetchBrands(); // Markaları getir
    
    // URL'den brandId varsa, ona göre şubeleri getir
    if (brandId) {
      setSelectedBrandId(brandId);
      fetchBranchesByBrand(brandId);
    } else {
      fetchAllBranches(); // Tüm şubeleri getir
    }
  }, [brandId]);

  // Form değişikliklerini izle
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Checkbox için checked değerini, diğerleri için value değerini kullan
    const inputValue = type === 'checkbox' ? checked : value;
    
    setForm({ ...form, [name]: inputValue });
  };

  // Marka seçimi değiştiğinde
  const handleBrandChange = (e) => {
    const newBrandId = e.target.value;
    setSelectedBrandId(newBrandId);
    
    // Eğer bir marka seçildiyse, URL'yi güncelle
    if (newBrandId) {
      navigate(`/admin/brands/${newBrandId}/branches`);
    } else {
      navigate("/admin/branches");
    }
    
    // Seçilen markaya göre şubeleri getir
    fetchBranchesByBrand(newBrandId);
  };

  // Şube ekleme/düzenleme modalını aç
  const handleAddEditBranch = (branch = null) => {
    if (branch) {
      // Düzenleme modu
      setEditingBranch(branch);
      setForm({
        name: branch.name || "",
        address: branch.address || "",
        phone: branch.phone || "",
        email: branch.email || "",
        manager_name: branch.manager_name || "",
        opening_hours: branch.opening_hours || "",
        description: branch.description || "",
        brand_id: branch.brand_id || selectedBrandId || "",
        is_active: branch.is_active !== false // undefined veya null ise true kabul et
      });
    } else {
      // Ekleme modu
      setEditingBranch(null);
      setForm({
        name: "",
        address: "",
        phone: "",
        email: "",
        manager_name: "",
        opening_hours: "",
        description: "",
        brand_id: selectedBrandId || "",
        is_active: true
      });
    }
    
    setShowModal(true);
  };

  // Form gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.brand_id) {
      toast.error("Lütfen bir marka seçin");
      return;
    }
    
    try {
      let response;
      
      if (editingBranch) {
        // Var olan şubeyi güncelle
        response = await api.put(`/api/branches/${editingBranch.id}`, form);
        toast.success(`${form.name} şubesi başarıyla güncellendi`);
      } else {
        // Yeni şube ekle
        response = await api.post("/api/branches", form);
        toast.success(`${form.name} şubesi başarıyla eklendi`);
      }
      
      // Şubeleri yeniden yükle
      if (selectedBrandId) {
        fetchBranchesByBrand(selectedBrandId);
      } else {
        fetchAllBranches();
      }
      
      // Modalı kapat
      setShowModal(false);
      
    } catch (error) {
      console.error("Form gönderilirken hata:", error);
      toast.error(error.response?.data?.error || "İşlem başarısız oldu!");
    }
  };

  // Şube silme işlemi
  const handleDelete = async (branchId) => {
    try {
      await api.delete(`/api/branches/${branchId}`);
      
      // Şubeleri güncelle
      setBranches(branches.filter(branch => branch.id !== branchId));
      
      toast.success("Şube başarıyla silindi");
      setConfirmDelete(null); // Silme onay penceresini kapat
    } catch (error) {
      console.error("Şube silinirken hata:", error);
      toast.error(error.response?.data?.error || "Şube silinemedi!");
    }
  };

  // Şubeleri marka bazında grupla
  const getBranchGroups = () => {
    if (selectedBrandId) {
      // Seçili markaya ait şubeler
      return {
        [selectedBrandId]: filteredBranches
      };
    } else {
      // Tüm şubeleri markalarına göre grupla
      const groups = {};
      
      filteredBranches.forEach(branch => {
        const brandId = branch.brand_id || 'uncategorized';
        if (!groups[brandId]) {
          groups[brandId] = [];
        }
        groups[brandId].push(branch);
      });
      
      return groups;
    }
  };

  // Filtreleme işlemleri
  const filteredBranches = branches.filter(branch => {
    return (
      branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Gruplandırılmış şubeler
  const branchGroups = getBranchGroups();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>Şube Yönetimi</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Marka Filtresi */}
            <div className="relative w-full md:w-64">
              <select
                value={selectedBrandId}
                onChange={handleBrandChange}
                className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none appearance-none"
                style={{ 
                  borderColor: "rgba(2, 43, 69, 0.2)",
                  boxShadow: "0 1px 3px rgba(2, 43, 69, 0.1)",
                  fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                  color: theme.textPrimary
                }}
              >
                <option value="">Tüm Markalar</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <FiBriefcase 
                className="absolute left-2 top-2.5" 
                size={20} 
                style={{ color: theme.accent }} 
              />
            </div>
            
            {/* Arama kutusu */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Şube ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none"
                style={{ 
                  borderColor: "rgba(2, 43, 69, 0.2)",
                  boxShadow: "0 1px 3px rgba(2, 43, 69, 0.1)",
                  fontSize: "0.95rem",
                  fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                  color: theme.textPrimary
                }}
              />
              <HiOutlineDocumentSearch 
                className="absolute left-2 top-2.5" 
                size={20} 
                style={{ color: theme.primary }} 
              />
            </div>
            
            {/* Görünüm Modu */}
            <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: "rgba(2, 43, 69, 0.2)" }}>
              <button 
                onClick={() => setSelectedView("grid")}
                className={`px-3 py-2 ${selectedView === "grid" ? "text-white" : ""}`}
                style={{ 
                  backgroundColor: selectedView === "grid" ? theme.primary : "white",
                  fontFamily: "'Nunito', 'Segoe UI', sans-serif"
                }}
                title="Kart Görünümü"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button 
                onClick={() => setSelectedView("table")}
                className={`px-3 py-2 ${selectedView === "table" ? "text-white" : ""}`}
                style={{ 
                  backgroundColor: selectedView === "table" ? theme.primary : "white",
                  fontFamily: "'Nunito', 'Segoe UI', sans-serif"
                }}
                title="Tablo Görünümü"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {/* Yeni Şube Ekle butonu */}
            <button
              onClick={() => handleAddEditBranch()}
              className="flex items-center justify-center gap-1 px-4 py-2 text-white rounded-lg transition-colors"
              style={{ 
                backgroundColor: theme.accent,
                fontWeight: 600,
                fontSize: "0.95rem",
                fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                boxShadow: "0 2px 4px rgba(217, 138, 61, 0.3)"
              }}
            >
              <FiPlus size={18} />
              <span>Yeni Şube Ekle</span>
            </button>
          </div>
        </div>
        
        {/* Bulunan şube sayısı */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm mr-2" style={{ color: theme.textSecondary }}>Toplam:</span>
            <span 
              className="px-2 py-1 rounded-full text-sm"
              style={{ 
                backgroundColor: theme.primary, 
                color: theme.white,
                fontFamily: "'Nunito', 'Segoe UI', sans-serif"
              }}
            >
              {filteredBranches.length} Şube
            </span>
          </div>
          
          {/* Aktif filtreleri göster */}
          {(searchTerm || selectedBrandId) && (
            <div className="flex items-center gap-2">
              {selectedBrandId && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: theme.light,
                    color: theme.primary,
                    fontFamily: "'Nunito', 'Segoe UI', sans-serif"
                  }}
                >
                  <FiBriefcase size={14} />
                  <span>
                    {brands.find(b => b.id == selectedBrandId)?.name || 'Marka'}
                  </span>
                </div>
              )}
              
              {searchTerm && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: theme.light,
                    color: theme.primary,
                    fontFamily: "'Nunito', 'Segoe UI', sans-serif"
                  }}
                >
                  <HiOutlineDocumentSearch size={14} />
                  <span>"{searchTerm}"</span>
                </div>
              )}
              
              <button
                onClick={() => {
                  setSearchTerm("");
                  // Marka seçimi sayfanın ana özelliği olduğu için, sadece arama filtresini temizliyoruz
                }}
                className="text-sm underline ml-2"
                style={{ color: theme.primary }}
              >
                Aramayı Temizle
              </button>
            </div>
          )}
        </div>
        
        {/* Şube Listesi */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
              style={{ borderColor: theme.primary }}
            ></div>
          </div>
        ) : filteredBranches.length === 0 ? (
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
              Şube Bulunamadı
            </h3>
            <p 
              className="mb-4" 
              style={{ color: theme.textSecondary }}
            >
              {searchTerm || selectedBrandId ? "Arama kriterlerinize uygun şube bulunmamaktadır." : "Henüz hiç şube eklenmemiş."}
            </p>
            {(searchTerm || selectedBrandId) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  if (selectedBrandId) {
                    // Eğer bir marka seçiliyse, sadece o markada şube yok demektir
                    // Markayı değiştirmeden sadece aramayı temizle
                  } else {
                    // Hem aramayı hem marka filtresini temizle
                    setSelectedBrandId("");
                    navigate("/admin/branches");
                  }
                }}
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: theme.primary }}
              >
                {selectedBrandId ? "Aramayı Temizle" : "Filtreleri Temizle"}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Marka bazında gruplanmış şubeler - Tablo veya Kart görünümü */}
            {selectedView === 'table' ? (
              // TABLO GÖRÜNÜMÜ
              <div className="overflow-x-auto border rounded-lg" style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}>
                <table className="min-w-full divide-y" style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}>
                  <thead style={{ backgroundColor: theme.light }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.primary }}>Şube Adı</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.primary }}>Adres</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.primary }}>İletişim</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.primary }}>Şube Yöneticisi</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.primary }}>Durum</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.primary }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}>
                    {Object.entries(branchGroups).map(([brandId, groupBranches]) => {
                      const brandName = brands.find(b => b.id == brandId)?.name || "Diğer";
                      
                      return groupBranches.map((branch, index) => (
                        <tr key={branch.id} className="hover:bg-gray-50">
                          {/* Şube adı */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium" style={{ color: theme.textPrimary }}>{branch.name}</span>
                              
                              {/* İlk satırda marka adını göster - gruplandırma başlığı */}
                              {!selectedBrandId && index === 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block w-fit"
                                  style={{ 
                                    backgroundColor: theme.secondary,
                                    color: theme.primary
                                  }}
                                >
                                  {brandName}
                                </span>
                              )}
                            </div>
                          </td>
                          
                          {/* Adres */}
                          <td className="px-4 py-3 text-sm" style={{ color: theme.textSecondary }}>
                            {branch.address || "-"}
                          </td>
                          
                          {/* İletişim */}
                          <td className="px-4 py-3">
                            <div className="text-sm" style={{ color: theme.textSecondary }}>
                              {branch.phone && (
                                <div className="flex items-center gap-1 mb-1">
                                  <FiPhone size={14} style={{ color: theme.accent }} />
                                  <span>{branch.phone}</span>
                                </div>
                              )}
                              {branch.email && (
                                <div className="flex items-center gap-1">
                                  <FiMail size={14} style={{ color: theme.accent }} />
                                  <span>{branch.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Şube Yöneticisi */}
                          <td className="px-4 py-3 text-sm" style={{ color: theme.textSecondary }}>
                            {branch.manager_name || "-"}
                          </td>
                          
                          {/* Durum */}
                          <td className="px-4 py-3 text-center">
                            <span 
                              className="text-xs px-2 py-1 rounded-full"
                              style={{ 
                                backgroundColor: branch.is_active !== false ? 'rgba(40, 167, 69, 0.15)' : 'rgba(108, 117, 125, 0.15)', 
                                color: branch.is_active !== false ? theme.success : theme.textSecondary
                              }}
                            >
                              {branch.is_active !== false ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                          
                          {/* İşlemler */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <Link
                                to={`/admin/branches/${branch.id}/products`}
                                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                title="Ürünleri Göster"
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="18" 
                                  height="18" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                  style={{ color: theme.info }}
                                >
                                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                  <line x1="3" y1="6" x2="21" y2="6"></line>
                                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                                </svg>
                              </Link>
                              <button
                                onClick={() => handleAddEditBranch(branch)}
                                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                title="Düzenle"
                              >
                                <FiEdit2 size={18} style={{ color: theme.primary }} />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(branch.id)}
                                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                title="Sil"
                              >
                                <FiTrash2 size={18} style={{ color: theme.danger }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              // KART GÖRÜNÜMÜ - Marka bazında gruplandırılmış
              <>
                {Object.entries(branchGroups).map(([brandId, groupBranches]) => {
                  const brandName = brands.find(b => b.id == brandId)?.name || "Diğer";
                  
                  return (
                    <div key={brandId} className="mb-8">
                      {/* Marka adını göster (yalnızca tüm markalar görüntüleniyorsa) */}
                      {!selectedBrandId && (
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}>
                          <FiBriefcase size={20} style={{ color: theme.accent }} />
                          <h2 className="text-lg font-semibold" style={{ color: theme.primary }}>
                            {brandName}
                          </h2>
                          <span className="text-sm ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.light, color: theme.textSecondary }}>
                            {groupBranches.length} şube
                          </span>
                        </div>
                      )}
                      
                      {/* Bu markaya ait şubeler */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupBranches.map(branch => (
                          <div 
                            key={branch.id} 
                            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}
                          >
                            <div 
                              className="text-white px-4 py-3 flex justify-between items-center"
                              style={{ backgroundColor: theme.primary }}
                            >
                              <h3 
                                className="font-semibold text-lg truncate"
                                style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                              >
                                {branch.name}
                              </h3>
                              <div className="flex gap-1">
                                <Link
                                  to={`/admin/branches/${branch.id}/products`}
                                  className="p-1.5 rounded-full hover:bg-blue-500 transition-colors"
                                  style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                  title="Ürünleri Göster"
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  >
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                                  </svg>
                                </Link>
                                <button
                                  onClick={() => handleAddEditBranch(branch)}
                                  className="p-1.5 rounded-full hover:bg-blue-500 transition-colors"
                                  style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                  title="Düzenle"
                                >
                                  <FiEdit2 size={16} />
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(branch.id)}
                                  className="p-1.5 rounded-full hover:bg-blue-500 transition-colors"
                                  style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                  title="Sil"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              {branch.address && (
                                <div className="flex items-start gap-2 mb-2">
                                  <FiMapPin style={{ color: theme.accent }} className="mt-0.5 flex-shrink-0" size={16} />
                                  <p 
                                    className="text-sm"
                                    style={{ color: theme.textPrimary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                                  >
                                    {branch.address}
                                  </p>
                                </div>
                              )}
                              
                              {branch.phone && (
                                <div className="flex items-center gap-2 mb-2">
                                  <FiPhone style={{ color: theme.accent }} size={16} />
                                  <p 
                                    className="text-sm"
                                    style={{ color: theme.textPrimary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                                  >
                                    {branch.phone}
                                  </p>
                                </div>
                              )}
                              
                              {branch.email && (
                                <div className="flex items-center gap-2 mb-2">
                                  <FiMail style={{ color: theme.accent }} size={16} />
                                  <p 
                                    className="text-sm"
                                    style={{ color: theme.textPrimary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                                  >
                                    {branch.email}
                                  </p>
                                </div>
                              )}
                              
                              {branch.opening_hours && (
                                <div className="flex items-center gap-2 mb-2">
                                  <FiHome style={{ color: theme.accent }} size={16} />
                                  <p 
                                    className="text-sm"
                                    style={{ color: theme.textPrimary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                                  >
                                    {branch.opening_hours}
                                  </p>
                                </div>
                              )}
                              
                              {branch.manager_name && (
                                <div className="flex items-center gap-2 mb-2">
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    style={{ color: theme.accent }}
                                  >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                  </svg>
                                  <p 
                                    className="text-sm"
                                    style={{ color: theme.textPrimary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                                  >
                                    {branch.manager_name}
                                  </p>
                                </div>
                              )}
                              
                              {branch.description && (
                                <div className="flex items-start gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}>
                                  <FiInfo style={{ color: theme.accent }} className="mt-0.5 flex-shrink-0" size={16} />
                                  <p 
                                    className="text-sm line-clamp-2"
                                    style={{ color: theme.textSecondary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                                  >
                                    {branch.description}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div 
                              className="px-4 py-3 border-t"
                              style={{ backgroundColor: theme.light, borderColor: "rgba(2, 43, 69, 0.1)" }}
                            >
                              <div className="flex justify-between items-center">
                                <span 
                                  className="text-sm font-medium"
                                  style={{ color: theme.primary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                                >
                                  Durum:
                                </span>
                                <span 
                                  className="text-sm font-medium px-2 py-1 rounded-full"
                                  style={{ 
                                    backgroundColor: branch.is_active !== false ? 'rgba(40, 167, 69, 0.15)' : 'rgba(108, 117, 125, 0.15)', 
                                    color: branch.is_active !== false ? theme.success : theme.textSecondary,
                                    fontFamily: "'Nunito', 'Segoe UI', sans-serif"
                                  }}
                                >
                                  {branch.is_active !== false ? 'Aktif' : 'Pasif'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
      
      {/* Şube Ekleme/Düzenleme Modalı */}
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
                style={{ color: theme.primary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
              >
                {editingBranch ? `${editingBranch.name} Şubesini Düzenle` : "Yeni Şube Ekle"}
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
                {/* Marka Seçimi - YENİ */}
                <div className="md:col-span-2">
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                  >
                    Marka *
                  </label>
                  <select
                    name="brand_id"
                    value={form.brand_id}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary,
                      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                      color: theme.textPrimary
                    }}
                    required
                  >
                    <option value="">Marka Seçin</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                  >
                    Şube Adı *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary,
                      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                      color: theme.textPrimary
                    }}
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                  >
                    Adres *
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleFormChange}
                    rows="2"
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary,
                      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                      color: theme.textPrimary
                    }}
                    required
                  ></textarea>
                </div>
                
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                  >
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary,
                      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                      color: theme.textPrimary
                    }}
                  />
                </div>
                
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                  >
                    E-posta
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary,
                      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                      color: theme.textPrimary
                    }}
                  />
                </div>
                
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                  >
                    Şube Yöneticisi
                  </label>
                  <input
                    type="text"
                    name="manager_name"
                    value={form.manager_name}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary,
                      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                      color: theme.textPrimary
                    }}
                  />
                </div>
                
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                  >
                    Çalışma Saatleri
                  </label>
                  <input
                    type="text"
                    name="opening_hours"
                    value={form.opening_hours}
                    onChange={handleFormChange}
                    placeholder="Örn: 09:00-18:00"
                    className="w-full p-2 border rounded-lg focus:outline-none"
                    style={{ 
                      borderColor: theme.secondary,
                      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                      color: theme.textPrimary
                    }}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: theme.primary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
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
                      borderColor: theme.secondary,
                      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                      color: theme.textPrimary
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
                        color: theme.primary, 
                        fontFamily: "'Nunito', 'Segoe UI', sans-serif" 
                      }}
                    >
                      Şube aktif
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
                    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                    fontWeight: 600
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{ 
                    backgroundColor: theme.accent,
                    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                    fontWeight: 600,
                    boxShadow: "0 2px 4px rgba(217, 138, 61, 0.3)"
                  }}
                >
                  {editingBranch ? "Güncelle" : "Ekle"}
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
                style={{ color: theme.primary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
              >
                Şubeyi Sil
              </h3>
              <p 
                className="mb-6"
                style={{ color: theme.textSecondary, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
              >
                Bu şubeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve şubeye bağlı tüm ürünler de etkilenebilir.
              </p>
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ 
                    borderColor: theme.secondary,
                    color: theme.primary,
                    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                    fontWeight: 600
                  }}
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{ 
                    backgroundColor: theme.danger,
                    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                    fontWeight: 600
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

export default BranchManager;