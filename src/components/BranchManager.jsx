import { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiMapPin, FiPhone, FiMail, 
  FiHome, FiInfo, FiBriefcase, FiFilter, FiExternalLink } from "react-icons/fi";
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
  const [allBranches, setAllBranches] = useState([]); // Tüm şubelerin listesi
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState(brandId || "");
  const [selectedView, setSelectedView] = useState("grid"); // "grid" veya "table"
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewMode, setViewMode] = useState(brandId ? "brand" : "all"); // "all" veya "brand"
  
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
      const brandsList = Array.isArray(response.data) ? response.data : [];
      setBrands(brandsList);
      
      // Eğer hiç marka yoksa uyarı göster
      if (brandsList.length === 0) {
        toast.warning("Hiç marka bulunamadı. Lütfen önce marka ekleyin.");
      }
    } catch (error) {
      console.error("Markalar yüklenirken hata:", error);
      toast.error("Markalar yüklenemedi!");
    }
  };

  // Tüm şubeleri getir
  const fetchAllBranches = async () => {
    setLoading(true);
    try {
      console.log("Tüm şubeler getiriliyor...");
      const response = await api.get("/api/branches");
      console.log("Tüm şubeler yanıtı:", response.data);
      
      const branchesData = Array.isArray(response.data) ? response.data : [];
      setAllBranches(branchesData);
      if (viewMode === "all") {
        setBranches(branchesData);
      }
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
      setViewMode("all");
      setBranches(allBranches);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Markaya (${brandId}) göre şubeler getiriliyor...`);
      const response = await api.get(`/api/brands/${brandId}/branches`);
      console.log("Marka şubeleri yanıtı:", response.data);
      
      // API yanıtının yapısını kontrol et
      let branchesArray = [];
      if (response.data && response.data.branches && Array.isArray(response.data.branches)) {
        branchesArray = response.data.branches;
      } else if (Array.isArray(response.data)) {
        branchesArray = response.data;
      }
      
      console.log("İşlenmiş marka şubeleri:", branchesArray);
      setBranches(branchesArray);
      setViewMode("brand");
    } catch (error) {
      console.error(`${brandId} ID'li markaya ait şubeler yüklenirken hata:`, error);
      toast.error("Şubeler yüklenemedi!");
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa ilk yüklendiğinde
  useEffect(() => {
    const loadData = async () => {
      await fetchBrands(); // Markaları getir
      await fetchAllBranches(); // Tüm şubeleri getir
      
      // Kaydedilmiş görünüm modunu yükle
      const savedView = localStorage.getItem('branchManagerView');
      if (savedView) {
        setSelectedView(savedView);
      }
      
      // URL'den brandId geldiğinde o markaya ait şubeleri getir
      if (brandId) {
        setSelectedBrandId(brandId);
        setViewMode("brand");
        fetchBranchesByBrand(brandId);
      }
    };
    
    loadData();
  }, []);
  
  // URL'den gelen brandId değiştiğinde
  useEffect(() => {
    if (brandId) {
      setSelectedBrandId(brandId);
      setViewMode("brand");
      fetchBranchesByBrand(brandId);
    }
  }, [brandId]);

  // Form değişikliklerini izle
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Checkbox için checked değerini, diğerleri için value değerini kullan
    const inputValue = type === 'checkbox' ? checked : value;
    
    // brand_id değiştiğinde form'u güncelle
    setForm({ ...form, [name]: inputValue });
  };

  // Marka seçimi değiştiğinde
  const handleBrandChange = (e) => {
    const newBrandId = e.target.value;
    setSelectedBrandId(newBrandId);
    
    // Eğer bir marka seçildiyse, URL'yi güncelle ve o markanın şubelerini getir
    if (newBrandId) {
      navigate(`/admin/brands/${newBrandId}/branches`);
      setViewMode("brand");
      fetchBranchesByBrand(newBrandId);
    } else {
      // Marka seçilmediğinde tüm şubeleri göster
      navigate("/admin/branches");
      setViewMode("all");
      setBranches(allBranches);
    }
  };
  
  // Görünüm modunu değiştir
  const toggleViewMode = () => {
    if (viewMode === "brand" && selectedBrandId) {
      setViewMode("all");
      setBranches(allBranches);
      navigate("/admin/branches");
      setSelectedBrandId("");
    } else if (viewMode === "all" && brands.length > 0) {
      const firstBrandId = brands[0].id;
      setViewMode("brand");
      setSelectedBrandId(firstBrandId);
      fetchBranchesByBrand(firstBrandId);
      navigate(`/admin/brands/${firstBrandId}/branches`);
    }
  };

  // Şube ekleme/düzenleme modalını aç
  const handleAddEditBranch = (branch = null) => {
    if (branch) {
      // Düzenleme modu
      console.log("Düzenlenecek şube:", branch);
      setEditingBranch(branch);
      setForm({
        name: branch.name || "",
        address: branch.address || "",
        phone: branch.phone || "",
        email: branch.email || "",
        manager_name: branch.manager_name || "",
        opening_hours: branch.opening_hours || "",
        description: branch.description || "",
        brand_id: branch.brand_id || selectedBrandId || (brands.length > 0 ? brands[0].id : ""),
        is_active: branch.is_active !== false // undefined veya null ise true kabul et
      });
    } else {
      // Ekleme modu - Seçili marka yoksa ilk markayı kullan
      setEditingBranch(null);
      const defaultBrandId = selectedBrandId || (brands.length > 0 ? brands[0].id : "");
      console.log("Yeni şube için varsayılan marka ID:", defaultBrandId);
      setForm({
        name: "",
        address: "",
        phone: "",
        email: "",
        manager_name: "",
        opening_hours: "",
        description: "",
        brand_id: defaultBrandId,
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
      // Form bilgilerini hazırla - brand_id string olabilir, number'a çevirelim
      const formData = { 
        ...form,
        brand_id: parseInt(form.brand_id) // String'i number'a çevir
      };
      
      console.log("Gönderilecek form verisi:", formData); // Debugging
      
      if (editingBranch) {
        // Var olan şubeyi güncelle
        response = await api.put(`/api/branches/${editingBranch.id}`, formData);
        
        // BACKEND WORKAROUND: Eğer backend'de brand_id güncellenmiyorsa, doğrudan veritabanı güncelleme isteği yapalım
        if (formData.brand_id !== editingBranch.brand_id) {
          try {
            // Direkt marka güncelleme isteği
            await api.post(`/api/branches/update-brand`, {
              branch_id: editingBranch.id,
              brand_id: formData.brand_id
            });
            console.log("Şube markası ayrıca güncellendi:", formData.brand_id);
          } catch (brandUpdateError) {
            console.error("Şube markası güncellenirken hata:", brandUpdateError);
            // Ana işleme devam et, bu ek bir güvenlik önlemi
          }
        }
        
        toast.success(`${form.name} şubesi başarıyla güncellendi`);
      } else {
        // Yeni şube ekle
        response = await api.post("/api/branches", formData);
        toast.success(`${form.name} şubesi başarıyla eklendi`);
      }
      
      console.log("API Yanıtı:", response.data); // Debugging
      
      // Kaydedilen şubenin markasını kontrol et
      const savedBrandId = response.data.brand_id || formData.brand_id;
      
      // Tüm şubeleri yeniden yükle - önemli! 
      await fetchAllBranches();
      
      // Markaya göre şubeleri yeniden yükle
      if (savedBrandId) {
        await fetchBranchesByBrand(savedBrandId.toString());
      }
      
      // Eğer bir marka görüntülüyorsak ve kaydettiğimiz şube o markaya aitse, o markanın şubelerini yeniden yükle
      if (viewMode === "brand" && savedBrandId.toString() === selectedBrandId) {
        // Zaten yukarıda yüklendi
      }
      // Eğer farklı bir markaya kaydettiyse ve şu an tüm şubeleri görüntülemiyorsak, o markaya geçiş yap
      else if (viewMode === "brand" && savedBrandId.toString() !== selectedBrandId) {
        setSelectedBrandId(savedBrandId.toString());
        navigate(`/admin/brands/${savedBrandId}/branches`);
      }
      
      // Markasız şubeleri yeniden yükle - özellikle marka değişiklikleri için
      if (viewMode === "all") {
        // Kısa bir gecikme ile yeniden yükle (API işlemlerinin tamamen bitmesini bekle)
        setTimeout(() => {
          fetchAllBranches();
        }, 500);
      }
      
      // Modalı kapat
      setShowModal(false);
      
    } catch (error) {
      console.error("Form gönderilirken hata:", error);
      console.error("Hata detayları:", error.response?.data || error.message);
      toast.error(error.response?.data?.error || "İşlem başarısız oldu!");
    }
  };

  // Şube silme işlemi
  const handleDelete = async (branchId) => {
    try {
      await api.delete(`/api/branches/${branchId}`);
      
      // Şubeleri güncelle - hem genel listeyi hem de mevcut görünümü
      setAllBranches(allBranches.filter(branch => branch.id !== branchId));
      setBranches(branches.filter(branch => branch.id !== branchId));
      
      toast.success("Şube başarıyla silindi");
      setConfirmDelete(null); // Silme onay penceresini kapat
    } catch (error) {
      console.error("Şube silinirken hata:", error);
      toast.error(error.response?.data?.error || "Şube silinemedi!");
    }
  };

  // Filtrelemeleri temizle
  const clearFilters = () => {
    setSearchTerm("");
  };

  // Filtreleme işlemleri
  const filteredBranches = branches.filter(branch => {
    return (
      branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Bir markaya ait şubeleri o markanın adıyla gruplandır
  const getBranchGroups = () => {
    // Eğer marka görünümündeyse, tek bir grup olarak döndür
    if (viewMode === "brand") {
      return {
        [selectedBrandId]: filteredBranches
      };
    }
    
    // Tüm şubelerde markaya göre grupla
    const groups = {};
    
    filteredBranches.forEach(branch => {
      const brandId = branch.brand_id || 'uncategorized';
      if (!groups[brandId]) {
        groups[brandId] = [];
      }
      groups[brandId].push(branch);
    });
    
    return groups;
  };
  
  // Gruplandırılmış şubeler
  const branchGroups = getBranchGroups();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>Şube Yönetimi</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Görünüm Modu Değiştirme */}
            <button
              onClick={toggleViewMode}
              className="flex items-center justify-center gap-1 px-4 py-2 border rounded-lg transition-colors"
              style={{ 
                borderColor: "rgba(2, 43, 69, 0.2)",
                color: theme.primary,
                fontFamily: "'Nunito', 'Segoe UI', sans-serif"
              }}
            >
              {viewMode === "brand" ? (
                <>
                  <FiFilter size={18} />
                  <span>Tüm Şubeleri Göster</span>
                </>
              ) : (
                <>
                  <FiBriefcase size={18} />
                  <span>Marka Bazlı Göster</span>
                </>
              )}
            </button>
            
            {/* Marka Filtresi - Sadece marka görünümündeyken göster */}
            {viewMode === "brand" && (
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
                  <option value="">Marka Seçin</option>
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
            )}
            
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
                onClick={() => {
                  setSelectedView("grid");
                  localStorage.setItem('branchManagerView', 'grid');
                }}
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
                onClick={() => {
                  setSelectedView("table");
                  localStorage.setItem('branchManagerView', 'table');
                }}
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
        
        {/* Aktif filtreler */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            {/* Görünüm modu bilgisi */}
            {viewMode === "brand" && selectedBrandId && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700">
                <FiBriefcase size={16} />
                <span className="font-medium">
                  {brands.find(b => b.id.toString() === selectedBrandId)?.name || "Seçili Marka"}
                </span>
              </div>
            )}
            {viewMode === "all" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-gray-700">
                <FiFilter size={16} />
                <span className="font-medium">Tüm Şubeler</span>
              </div>
            )}
            
            <span className="text-sm mx-2 text-gray-400">•</span>
            
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
          
          {/* Arama filtresi */}
          {searchTerm && (
            <div className="flex items-center gap-2">
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
              
              <button
                onClick={clearFilters}
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
              {searchTerm ? "Arama kriterlerinize uygun şube bulunmamaktadır." : 
               viewMode === "brand" && selectedBrandId ? "Bu markaya ait şube bulunmamaktadır." : 
               "Henüz hiç şube eklenmemiş."}
            </p>
            
            {searchTerm ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: theme.primary }}
              >
                Aramayı Temizle
              </button>
            ) : (
              <button
                onClick={() => handleAddEditBranch()}
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: theme.accent }}
              >
                Şube Ekle
              </button>
            )}
          </div>
        ) : selectedView === "table" ? (
          // TABLO GÖRÜNÜMÜ
          <div className="overflow-x-auto border rounded-lg" style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}>
            <table className="min-w-full divide-y" style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}>
              <thead style={{ backgroundColor: theme.light }}>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.primary }}>Şube Adı</th>
                  {viewMode === "all" && (
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.primary }}>Marka</th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.primary }}>Adres</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.primary }}>İletişim</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.primary }}>Şube Yöneticisi</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.primary }}>Durum</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.primary }}>İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}>
                {filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    {/* Şube adı */}
                    <td className="px-4 py-3">
                      <span className="font-medium" style={{ color: theme.textPrimary }}>{branch.name}</span>
                    </td>
                    
                    {/* Marka adı - Sadece tüm şubeleri görüntülerken */}
                    {viewMode === "all" && (
                      <td className="px-4 py-3">
                        {branch.brand_id ? (
                          <span className="px-2 py-0.5 text-xs rounded-full text-blue-700 bg-blue-50">
                            {brands.find(b => b.id.toString() === branch.brand_id?.toString())?.name || "Bilinmeyen Marka"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded-full text-gray-600 bg-gray-100">Markasız</span>
                        )}
                      </td>
                    )}
                    
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // KART GÖRÜNÜMÜ
          <>
            {/* Marka bazlı gruplandırma - Sadece tüm görünümdeyken göster */}
            {viewMode === "all" ? (
              // Markaya göre gruplandırılmış kartlar
              Object.entries(branchGroups).map(([brandId, groupBranches]) => {
                // Marka adını bul
                const brandName = brandId === "uncategorized" ? 
                  "Markasız Şubeler" : 
                  brands.find(b => b.id.toString() === brandId)?.name || "Diğer";
                
                return (
                  <div key={brandId} className="mb-8">
                    {/* Marka başlığı */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}>
                      <FiBriefcase size={20} style={{ color: theme.accent }} />
                      <h2 className="text-lg font-semibold" style={{ color: theme.primary }}>
                        {brandName}
                      </h2>
                      <span className="text-sm ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.light, color: theme.textSecondary }}>
                        {groupBranches.length} şube
                      </span>
                      
                      {/* Marka detayına gitme butonu - sadece gerçek bir marka ise */}
                      {brandId !== "uncategorized" && (
                        <Link 
                          to={`/admin/brands/${brandId}/branches`}
                          className="ml-auto text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <span>Marka Detayı</span>
                          <FiExternalLink size={14} />
                        </Link>
                      )}
                    </div>
                    
                    {/* Bu markaya ait şube kartları */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      {groupBranches.map(branch => (
                        <BranchCard 
                          key={branch.id}
                          branch={branch}
                          theme={theme}
                          onEdit={() => handleAddEditBranch(branch)}
                          onDelete={() => setConfirmDelete(branch.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              // Marka filtresi aktifken, grupsuz düz kartlar
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBranches.map(branch => (
                  <BranchCard 
                    key={branch.id}
                    branch={branch}
                    theme={theme}
                    onEdit={() => handleAddEditBranch(branch)}
                    onDelete={() => setConfirmDelete(branch.id)}
                  />
                ))}
              </div>
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
                {/* Marka Seçimi */}
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

// Şube Kartı Bileşeni (kodun daha düzenli olması için ayrı bileşen olarak tanımlandı)
const BranchCard = ({ branch, theme, onEdit, onDelete }) => {
  return (
    <div 
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
            onClick={onEdit}
            className="p-1.5 rounded-full hover:bg-blue-500 transition-colors"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            title="Düzenle"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={onDelete}
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
  );
};

export default BranchManager;